
# GPT Assistant

![Chat UI repository thumbnail](https://i.ibb.co/nfc23Rg/GPT-Assistant.png)

A chat interface using open source models.

The default config for Chat UI is stored in the `.env` file. You will need to override some values to get Chat UI to run locally. This is done in `.env.local`.

Start by creating a `.env.local` file in the root of the repository. The bare minimum config you need to get Chat UI to run locally is the following:

```env
MONGODB_URL=<the URL to your MongoDB instance>
HF_ACCESS_TOKEN=<your access token>
```

### Database

The chat history is stored in a MongoDB instance, and having a DB instance available is needed for Chat UI to work.

You can use a local MongoDB instance. The easiest way is to spin one up using docker:

```bash
docker run -d -p 27017:27017 --name mongo-chatui mongo:latest
```

In which case the url of your DB will be `MONGODB_URL=mongodb://localhost:27017`.

Alternatively, you can use a [free MongoDB Atlas](https://www.mongodb.com/pricing) instance for this, Chat UI should fit comfortably within their free tier. After which you can set the `MONGODB_URL` variable in `.env.local` to match your instance.

## Launch

After you're done with the `.env.local` file you can run Chat UI locally with:

```bash
npm install
npm run dev
```

### Web Search config

You can enable the web search through an API by adding `YDC_API_KEY` ([docs.you.com](https://docs.you.com)) or `SERPER_API_KEY` ([serper.dev](https://serper.dev/)) or `SERPAPI_KEY` ([serpapi.com](https://serpapi.com/)) to your `.env.local`.

You can also simply enable the local websearch by setting `USE_LOCAL_WEBSEARCH=true` in your `.env.local`.

#### Running your own models using a custom endpoint

If you want to, instead of hitting models on the Hugging Face Inference API, you can run your own models locally.

A good option is to hit a [text-generation-inference](https://github.com/huggingface/text-generation-inference) endpoint. This is what is done in the official [Chat UI Spaces Docker template](https://huggingface.co/new-space?template=huggingchat/chat-ui-template) for instance: both this app and a text-generation-inference server run inside the same container.

To do this, you can add your own endpoints to the `MODELS` variable in `.env.local`, by adding an `"endpoints"` key for each model in `MODELS`.

```env
{
// rest of the model config here
"endpoints": [{
  "type" : "tgi",
  "url": "https://HOST:PORT",
  }]
}
```

If `endpoints` are left unspecified, ChatUI will look for the model on the hosted Hugging Face inference API using the model name.

##### OpenAI API compatible models

Chat UI can be used with any API server that supports OpenAI API compatibility, for example [text-generation-webui](https://github.com/oobabooga/text-generation-webui/tree/main/extensions/openai), [LocalAI](https://github.com/go-skynet/LocalAI), [FastChat](https://github.com/lm-sys/FastChat/blob/main/docs/openai_api.md), [llama-cpp-python](https://github.com/abetlen/llama-cpp-python), and [ialacol](https://github.com/chenhunghan/ialacol).

The following example config makes Chat UI works with [text-generation-webui](https://github.com/oobabooga/text-generation-webui/tree/main/extensions/openai), the `endpoint.baseUrl` is the url of the OpenAI API compatible server, this overrides the baseUrl to be used by OpenAI instance. The `endpoint.completion` determine which endpoint to be used, default is `chat_completions` which uses `v1/chat/completions`, change to `endpoint.completion` to `completions` to use the `v1/completions` endpoint.

```
MODELS=`[
  {
    "name": "text-generation-webui",
    "id": "text-generation-webui",
    "parameters": {
      "temperature": 0.9,
      "top_p": 0.95,
      "repetition_penalty": 1.2,
      "top_k": 50,
      "truncate": 1000,
      "max_new_tokens": 1024,
      "stop": []
    },
    "endpoints": [{
      "type" : "openai",
      "baseURL": "http://localhost:8000/v1"
    }]
  }
]`

```

The `openai` type includes official OpenAI models. You can add, for example, GPT4/GPT3.5 as a "openai" model:

```
OPENAI_API_KEY=#your openai api key here
MODELS=`[{
      "name": "gpt-4",
      "displayName": "GPT 4",
      "endpoints" : [{
        "type": "openai"
      }]
},
      {
      "name": "gpt-3.5-turbo",
      "displayName": "GPT 3.5 Turbo",
      "endpoints" : [{
        "type": "openai"
      }]
}]`
```

##### Llama.cpp API server

chat-ui also supports the llama.cpp API server directly without the need for an adapter. You can do this using the `llamacpp` endpoint type.

If you want to run chat-ui with llama.cpp, you can do the following, using Zephyr as an example model:

1. Get [the weights](https://huggingface.co/TheBloke/zephyr-7B-beta-GGUF/tree/main) from the hub
2. Run the server with the following command: `./server -m models/zephyr-7b-beta.Q4_K_M.gguf -c 2048 -np 3`
3. Add the following to your `.env.local`:

```env
MODELS=[
  {
      "name": "Local Zephyr",
      "chatPromptTemplate": "<|system|>\n{{preprompt}}</s>\n{{#each messages}}{{#ifUser}}<|user|>\n{{content}}</s>\n<|assistant|>\n{{/ifUser}}{{#ifAssistant}}{{content}}</s>\n{{/ifAssistant}}{{/each}}",
      "parameters": {
        "temperature": 0.1,
        "top_p": 0.95,
        "repetition_penalty": 1.2,
        "top_k": 50,
        "truncate": 1000,
        "max_new_tokens": 2048,
        "stop": ["</s>"]
      },
      "endpoints": [
        {
         "url": "http://127.0.0.1:8080",
         "type": "llamacpp"
        }
      ]
  }
]
```

Start chat-ui with `npm run dev` and you should be able to chat with Zephyr locally.

#### Ollama

We also support the Ollama inference server. Spin up a model with

```cli
ollama run mistral
```

Then specify the endpoints like so:

```env
MODELS=[
  {
      "name": "Ollama Mistral",
      "chatPromptTemplate": "<s>{{#each messages}}{{#ifUser}}[INST] {{#if @first}}{{#if @root.preprompt}}{{@root.preprompt}}\n{{/if}}{{/if}} {{content}} [/INST]{{/ifUser}}{{#ifAssistant}}{{content}}</s> {{/ifAssistant}}{{/each}}",
      "parameters": {
        "temperature": 0.1,
        "top_p": 0.95,
        "repetition_penalty": 1.2,
        "top_k": 50,
        "truncate": 3072,
        "max_new_tokens": 1024,
        "stop": ["</s>"]
      },
      "endpoints": [
        {
         "type": "ollama",
         "url" : "http://127.0.0.1:11434",
         "ollamaName" : "mistral"
        }
      ]
  }
]
```

#### Amazon

You can also specify your Amazon SageMaker instance as an endpoint for chat-ui. The config goes like this:

```env
"endpoints": [
    {
      "type" : "aws",
      "service" : "sagemaker"
      "url": "",
      "accessKey": "",
      "secretKey" : "",
      "sessionToken": "",
      "region": "",

      "weight": 1
    }
]
```

You can also set `"service" : "lambda"` to use a lambda instance.

You can get the `accessKey` and `secretKey` from your AWS user, under programmatic access.

### Custom endpoint authorization

#### Basic and Bearer

Custom endpoints may require authorization, depending on how you configure them. Authentication will usually be set either with `Basic` or `Bearer`.

For `Basic` we will need to generate a base64 encoding of the username and password.

`echo -n "USER:PASS" | base64`

> VVNFUjpQQVNT

For `Bearer` you can use a token, which can be grabbed from [here](https://huggingface.co/settings/tokens).

You can then add the generated information and the `authorization` parameter to your `.env.local`.

```env
"endpoints": [
{
"url": "https://HOST:PORT",
"authorization": "Basic VVNFUjpQQVNT",
}
]
```

#### Models hosted on multiple custom endpoints

If the model being hosted will be available on multiple servers/instances add the `weight` parameter to your `.env.local`. The `weight` will be used to determine the probability of requesting a particular endpoint.

```env
"endpoints": [
{
"url": "https://HOST:PORT",
"weight": 1
}
{
"url": "https://HOST:PORT",
"weight": 2
}
...
]
```

#### Client Certificate Authentication (mTLS)

Custom endpoints may require client certificate authentication, depending on how you configure them. To enable mTLS between Chat UI and your custom endpoint, you will need to set the `USE_CLIENT_CERTIFICATE` to `true`, and add the `CERT_PATH` and `KEY_PATH` parameters to your `.env.local`. These parameters should point to the location of the certificate and key files on your local machine. The certificate and key files should be in PEM format. The key file can be encrypted with a passphrase, in which case you will also need to add the `CLIENT_KEY_PASSWORD` parameter to your `.env.local`.

If you're using a certificate signed by a private CA, you will also need to add the `CA_PATH` parameter to your `.env.local`. This parameter should point to the location of the CA certificate file on your local machine.

If you're using a self-signed certificate, e.g. for testing or development purposes, you can set the `REJECT_UNAUTHORIZED` parameter to `false` in your `.env.local`. This will disable certificate validation, and allow Chat UI to connect to your custom endpoint.

## Deploying to a HF Space

Create a `DOTENV_LOCAL` secret to your HF space with the content of your .env.local, and they will be picked up automatically when you run.

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
