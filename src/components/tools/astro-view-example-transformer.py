class WeightedEmbedding(CodeTransformation):
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
            "class_embedding": np.array(class_embedding), 
            "method_name_embedding": np.array(method_name_embedding), 
            "method_body_embedding": np.array(method_body_embedding)
        }

    def reduce(self, df):
        return \
            df['class_embedding'] * 0.2 + \
            df['method_name_embedding'] * 0.1 + \
            df['method_body_embedding'] * 0.7