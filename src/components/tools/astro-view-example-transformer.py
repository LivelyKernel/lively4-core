class ConcatIdentifierEmbedding(CodeTransformation):
    def context(self):
        return 'file'
    
    def query(self, AST, line):
        return AST('''
          (class_declaration
              (type_identifier) @class_name
              (class_body
                  (method_definition
                      name: (property_identifier) @method_name
                      body: (statement_block) @method_body
                  ) @method
              )
          ) @class
        ''')

    def map(self, match, context_embedding, query_node):
        (id, path, query_id, captures) = match

        # average of all embeddings for tokens in the method body
        method_node = captures['@method']
        method_embeddings = context_embedding(method_node)
        method_embedding = np.mean(method_embeddings, axis=0)
 
        class_name_embedding = context_embedding(captures['@class_name'])[0]

        id_matches = query_node('(identifier) @identifier', method_node)
        if len(id_matches) > 0:
            identifier_nodes = [match['@identifier'] for match in id_matches]

            identifier_embeddings = np.array([context_embedding(node)[0] for node in identifier_nodes])
            identifier_mean = np.mean(identifier_embeddings, axis=0)
        else:
            identifier_mean = np.zeros(method_embedding.shape[0])

        # return dict with embeddings
        return {
            "class_name_embedding": class_name_embedding,
            "method_embedding": method_embedding,
            "identifier_mean": identifier_mean,
            "plot_title": captures['@method_name'].text.decode(),
            "plot_content": captures['@method'].text.decode()
        }

    def reduce(self, df):
        # weighted sum of embeddings
        # class_embedding 0.1, method_name_embedding 0.2, method_body_embedding 0.7
        # multiply whole columns by respective scalar, then add them together

        return \
            df['method_embedding'] * 0.5 + \
            df['class_name_embedding'] * 0.4 + \
            df['identifier_mean'] + 0.1
      
    def cluster(self):
        from sklearn.cluster import AgglomerativeClustering
        return AgglomerativeClustering(
          n_clusters=None, 
          distance_threshold=130, 
          linkage='ward'
        )