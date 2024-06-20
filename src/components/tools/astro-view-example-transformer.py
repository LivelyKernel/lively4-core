QUERY = """
    (function_declaration) @function
    
    (class_declaration
        (type_identifier) @class_name
        (class_body
            (method_definition
                name: (property_identifier) @method_name
                body: (statement_block) @method_body
            ) @method
        )
    ) @class
"""

class ConcatEmbedding(CodeTransformation):
    def queryAST(self):
        return '''
            (class_declaration
                (type_identifier) @class_name
                (class_body
                    (method_definition
                        name: (property_identifier) @method_name
                        body: (statement_block) @method_body
                    ) @method
                )
            ) @class
        '''

    async def mapCaptures(self, query_result, text_embedding, make_query):
        # (path, query_id, capture_dict) = query_result

        class_name = self.textFromCapture(query_result, 'class_name')
        method = self.textFromCapture(query_result, 'method')

        concat_embedding = f'''
            class {class_name} {{
                {method}
            }}
            '''.strip()
        
        pooler_embedding = await text_embedding(concat_embedding)
        
        return {
            'embedded_code': concat_embedding,
            'embedding': pooler_embedding
        }

    def reduce(self, df):
        return df['embedding']

class WeightedEmbedding(CodeTransformation):
    def queryAST(self):
        return QUERY

    async def mapCaptures(self, query_result, text_embedding, make_query):
        # (id, path, query_id, captures, _) = query_result

        [class_name, method_name, method_body] = [
            self.textFromCapture(query_result, 'class_name'), 
            self.textFromCapture(query_result, 'method_name'), 
            self.textFromCapture(query_result, 'method_body')
        ]

        [class_embedding, method_name_embedding, method_body_embedding] = await asyncio.gather(
            text_embedding(class_name),
            text_embedding(method_name),
            text_embedding(method_body)
        )

        # return dict with embeddings
        return {
            "class_embedding": class_embedding, 
            "method_name_embedding": method_name_embedding, 
            "method_body_embedding": method_body_embedding
        }

    def reduce(self, df):
        # weighted sum of embeddings
        # class_embedding 0.1, method_name_embedding 0.2, method_body_embedding 0.7
        # multiply whole columns by respective scalar, then add them together

        return df['class_embedding'] + df['method_name_embedding'] + df['method_body_embedding']
    
class IdentifierEmbedding(CodeTransformation):

    def queryAST(self):
        return QUERY

    async def mapCaptures(self, query_result, text_embedding, make_query):
        (id, path, query_id, captures) = query_result

        node = captures['method_body']
        query = make_query('(identifier) @identifier')

        all_identifiers = query.matches(node)
        all_identifiers = [captures.get('identifier').text.decode() for q_id, captures in all_identifiers]

        identifier_embeddings = asyncio.gather(*[text_embedding(identifier) for identifier in all_identifiers])

        # return dict with embeddings
        return {
            "identifiers": all_identifiers, 
            "identifers_embeddings": identifier_embeddings, 
        }

    def reduce(self, df):
        # weighted sum of embeddings
        # class_embedding 0.1, method_name_embedding 0.2, method_body_embedding 0.7
        # multiply whole columns by respective scalar, then add them together

        return df['identifiers']