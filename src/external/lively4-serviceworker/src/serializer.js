/**
 * Serializes an object. Request and Response currently supported.
 * @param object The object to be serialized
 * @return Dict A dictionary containing the serialized data
 */
async function serialize(object) {
  if(object instanceof Response) {
    return _serializeResponse(object);
  } else if(object instanceof Request) {
    return _serializeRequest(object);
  } else {
    return null;
  }
}

/**
 * Deserializes a serialized object
 * @param serializedObject A dictionary containing the serialized data
 * @return Request/Response Deserialized object
 */
async function deserialize(serializedObject) {
  switch(serializedObject.type) {
    case 'response':
      return _deserializeResponse(serializedObject);
      break;
    case 'request':
      return _deserializeRequest(serializedObject);
      break;
    default:
      return null;
  }
}

// Export public functions
export default {
  serialize,
  deserialize
}


/* Private functions */

/**
 * Serializes a Headers object
 * @param headers The Headers object
 * @return Dict A dictionary containing the serialized data
 */
function _serializeHeaders(headers) {
  let serializedHeaders = {};
  for (let pair of headers.entries()) {
     serializedHeaders[pair[0]] = pair[1];
  }
  return serializedHeaders;
}

/**
 * Serializes a Response object
 * @param respones The Response object
 * @return Dict A dictionary containing the serialized data
 */
async function _serializeResponse(response) {    
  const serializedHeaders = _serializeHeaders(response.headers);

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
 * Deserializes a serialized response
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

/**
 * Serializes a Request object
 * @param respones The Request object
 * @return Dict A dictionary containing the serialized data
 */
async function _serializeRequest(request) {    
  const serializedHeaders = _serializeHeaders(request.headers);

  // Serialize body
  const blob = await request.clone().blob();

  // Build serialized response
  const serializedRequest = {
    type: 'request',
    method: request.method,
    url: request.url,
    headers: serializedHeaders,
    context: request.context,
    referrer: request.referrer,
    referrerPolicy: request.referrerPolicy,
    mode: request.mode,
    credentials: request.credentials,
    redirect: request.redirect,
    integrity: request.integrity,
    cache: request.cache,
    body: blob,
    bodyUsed: request.bodyUsed
  };

  return serializedRequest;
}

/**
 * Deserializes a serialized request
 * @param serializedRequest A dictionary containing the serialized data
 * @return Request object
 */
async function _deserializeRequest(serializedRequest) {
  return new Request(
    serializedRequest.url,
    {
      method: serializedRequest.method,
      headers: new Headers(serializedRequest.headers),
      body: serializedRequest.body,
      mode: serializedRequest.mode,
      credentials: serializedRequest.credentials,
      cache: serializedRequest.cache,
      redirect: serializedRequest.redirect,
      referrer: serializedRequest.referrer,
      integrity: serializedRequest.integrity
    }
  );
}
