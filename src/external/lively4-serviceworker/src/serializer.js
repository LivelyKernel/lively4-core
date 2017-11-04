/**
 * Serializes an object to be stored in the CachStorage
 * @param object The object to be serialized
 * @return Dict A dictionary containing the serialized data
 */
async function serialize(object) {
  if(object instanceof Response) {
    return _serializeResponse(object);
  }
}

/**
 * Deserializes a serialized object dictionary returned from the CachStorage
 * @param serializedObject A dictionary containing the serialized data
 * @return Request/Response Deserialized object
 */
async function deserialize(serializedObject) {
  switch(serializedObject.type) {
    case 'response':
      return _deserializeResponse(serializedObject);
  }
}

// Export public functions
export default {
  serialize,
  deserialize
}


/* Private functions */

/**
 * Serializes a Response object to be stored in the CachStorage
 * @param respones The Response object
 * @return Dict A dictionary containing the serialized data
 */
async function _serializeResponse(response) {    
  // Serialize headers
  let serializedHeaders = {};
  for (let pair of response.headers.entries()) {
     serializedHeaders[pair[0]] = pair[1];
  }

  // Serialize body
  const blob = await response.clone().blob();

  // Build serialized response
  const serializedResponse = {
    type: 'response',
    status: response.status,
    statusText: response.statusText,
    headers: serializedHeaders,
    body: blob
  };

  return serializedResponse;
}

/**
 * Deserializes a serialized response dictionary returned from the CachStorage
 * @param serializedResponse A dictionary containing the serialized data
 * @return Response object
 */
async function _deserializeResponse(serializedResponse) {
  return new Response(
    serializedResponse.body,
    {
      status: serializedResponse.status,
      statusText: serializedResponse.statusText,
      headers: new Headers(serializedResponse.headers)
    }
  );
}