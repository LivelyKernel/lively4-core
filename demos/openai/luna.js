const openAiSubscriptionKeyId = "openai-key";
import files from 'src/client/files.js';
import _ from 'src/external/lodash/lodash.js'


const BASE_FILE_PATH = 'https://lively-kernel.org/lively4/lively4-lu/demos/';
const MAX_MESSAGES_PER_CONTEXT = 10;

export default class Luna {
  
  constructor(){
    this.callableFunctions = {};
    this.prepared = false;
  }
  
  async prepare(){
    this.ensureSubscriptionKey();
    this.openAiApiKey = await this.ensureSubscriptionKey();
    this.openaiUrl = "https://api.openai.com/v1/chat/completions";
  }
  
  async ensureSubscriptionKey() {
    var key = this.getSubscriptionKey()
    if (!key) {
      key = await lively.prompt(`Enter your OpenAI key`, "");
      this.setSubscriptionKey(key);
    }
    return key
  }

  getSubscriptionKey() {
    return localStorage.getItem(openAiSubscriptionKeyId);
  }
  
  async executePrompt(lunaContext){
    
    // Ensure initialization
    if (!this.prepared) await this.prepare()
    
    const messageHistory = lunaContext.lastMessageHistory();
    
    // Guard to avoid long conversations
    if (messageHistory.length >= MAX_MESSAGES_PER_CONTEXT){
      lively.error(`Query exceeded maximum message per context. ('${MAX_MESSAGES_PER_CONTEXT}')`)
      return;
    }
    
    let prompt = {
      ...this.promptConstants(),
      functions: this.callableFunctionsInfo(),
      messages: messageHistory,
    }
    
    const requestOptions = {
      method: "POST",
      cache: "force-cache",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.openAiApiKey}`
      },
      body: JSON.stringify(prompt)
    };
    const response = await fetch(this.openaiUrl, requestOptions);
    const dataResponse = await response.json();
    
    if (dataResponse.choices.first.message){
      const reply = dataResponse.choices.first.message
      
      // Todo reuse type of message function
      if (reply.function_call){  
        const systemResponse = await this.handleFunctionCall(reply);
        lunaContext.push(prompt, dataResponse, systemResponse)
      }
      else if (reply.content){
        lunaContext.push(prompt, dataResponse)
      }
      else lively.error('Received reply from OpenAI without defined follow-up workflow');
    }
    const probe = lunaContext.lastResponseType();

    // Continue conversation if last response was a function_call
    if (lunaContext.lastResponseType() === "function_call"){
      await this.executePrompt(lunaContext);
    }
    
    return lunaContext
  }
  
  async handleFunctionCall(reply){
    const functionCall = reply.function_call;
    const functionArguments = JSON.parse(functionCall.arguments)

    // Check if function OpenAI wants to execute is registered.
    if (!(functionCall.name in this.callableFunctions)){
      lively.error('OpenAI tried to call a non-existing function ${functionCall.name}')
    }

    const func = this.callableFunctions[functionCall.name]
    const result = await func.call(this, functionArguments) // TODO what if function returns null/ undefined?

    return result
  }
  
  promptConstants(){
    return {
      "model": "gpt-3.5-turbo-0613",
      "max_tokens": 500,
      "temperature": 0.1,
      "top_p": 1,
      "n": 1,
      "stream": false,
      "stop": "VANILLA"
    }
  }
  
  async query(question) {
    let lunaContext = new LunaContext(question);
    return await this.executePrompt(lunaContext);
  }
  
  
 /*MD
 Temp function register
 */
  callableFunctionsInfo(){
    let availableFunctions = [];
    
    const listFilesSchema = {
      "name": "listFiles",
      "description": "Returns a list of available files for a URL.",
      "parameters": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string",
            "description": "Return available files for the provided URL."
          }
       },
      "required": ["path"]
      }
    }
    availableFunctions.push(listFilesSchema);
    this.callableFunctions['listFiles'] = async function(args) {
      return await _.map((await files.fileTree(BASE_FILE_PATH + args.path)).children, 'name')
    }
    
    return availableFunctions
  }
}

export class LunaContext {
  
  constructor(query){
    this.defaultHistory = [
      { "role": "system", "content": "You help a developer to answer questions about a code repository. You may invoke up to 5 functions to gain more information about the repository to answer the question."},
      { "role": "system", "content": "Answer the following question." },
      { "role": "user", "content": query }
    ]
    this.context = []
  }
  
  push(request, response, functionResult) {
    if (_.isUndefined(request)  || _.isUndefined(response)){
      lively.error('Received dialog with empty request or empy response.')
    }
    
    this.context.push({
      request: request,
      response: response,
      systemResponse: functionResult
    })
  }
  
  getResponseType(response) {

    const message = response.choices.first.message;
    
    if (message.function_call) return 'function_call'
    else if (message.content) return 'natural_language'
    else return 'unknown'
  }
  
  lastResponseType() { 
    return this.getResponseType(this.context.last.response)
  }
  
  // Last message history consists of request messages + response messages
  lastMessageHistory(){
     if ( this.context.isEmpty()) {
       return _.clone(this.defaultHistory);
     }
    
     // Last message history consists of request messages + response messages
     let messageHistory = _.clone(this.context.last.request.messages);

     // Add message of last response
     switch (this.lastResponseType()) {
       case 'function_call': 
         messageHistory.push(this.context.last.response.choices.first.message);
         messageHistory.push({
          "role": "function",
          "name": this.context.last.response.choices.first.message.function_call.name,
          "content": JSON.stringify(this.context.last.systemResponse)
        })
        break;
       case 'natural_language':
         messageHistory.push({
           "role": "assistant",
           "content": this.context.last.response.choices.first.message.content
         })
     }

     return messageHistory
  }
  
  getFinalResponse(){
    if (this.lastMessageHistory().last.role !== 'assistant'){
      lively.error('Tried to access final response before finishing conversation.');
    }
    return this.lastMessageHistory().last.content;
  }
}

