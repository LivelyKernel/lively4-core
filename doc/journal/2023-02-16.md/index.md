## 2023-02-16 Experiment SWACopilot
*Author: @JensLincke*


Use Alt+K #KeyboardShortcut 

![](swacopilot_experiment.png)


```javascript
async trySWACopilot(text) {
    var start = Date.now()
    var result = await fetch(`https://lively-kernel.org/swacopilot?maxlength=300&temperature=0.4&text=` + 
                              encodeURIComponent(text)).then(r => r.json())
    if(result.generation) {
      this.editor.setCursor(this.editor.getCursor("end"));
      this.editor.replaceSelection(result.generation, "around");
    }
    lively.notify("SWA Copilot: " + (Date.now() - start) + "ms")
  } 
```


Server code:

```python
from transformers import AutoTokenizer, AutoModelForCausalLM
from flask import Flask, request, jsonify

app = Flask(__name__)


device = "cuda"  # "cpu" or "cuda" or "cuda:n" where n is specific GPU to use
modelname = "EleutherAI/gpt-neo-2.7B"
tokenizer = AutoTokenizer.from_pretrained(modelname)
model = AutoModelForCausalLM.from_pretrained(modelname)
model.to(device)

# Prepend to input to provide more context. Anecdotally, this helps.
# May not need for larger models.
prime = '''
function palindrome(str) {
  var re = /[\W_]/g;
  var lowRegStr = str.toLowerCase().replace(re, '');
  var reverseStr = lowRegStr.split('').reverse().join('');
  return reverseStr === lowRegStr;
}

// ---

function isEven(n) {
  n = Number(n);
  return n === 0 || !!(n && !(n%2));
}

// ---

/* Return the square root of an integer */
function square_root(i) {
  return Math.sqrt(i)
}

// ---
'''



def inference(prompt, temperature, max_length):
    input_ids = tokenizer(prompt, return_tensors="pt").input_ids
    input_ids = input_ids.to(device)
    gen_tokens = model.generate(
        input_ids,
        do_sample=True,
        temperature=temperature,
        max_length=max_length,
    )
    gen_text = tokenizer.batch_decode(gen_tokens)[0]
    return gen_text


def autocomplete(plaintext, to_prime=True, temperature=0.8, max_length=300):
    prompt = prime + plaintext if to_prime else plaintext
    generation = inference(prompt, temperature, max_length)
    return generation[len(prompt) :].split("// ---")[0]


@app.route("/")
def arguments():
    text = request.args.get("text", "")
    temperature = float(request.args.get("temperature", "0.8"))
    maxlength = int(request.args.get("maxlength", "300"))
    to_prime = request.args.get("prime", "True") == "True"
    generation = autocomplete(text, to_prime, temperature, maxlength)
    out = {"generation": generation}
    return jsonify(out)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port="9009")
    
    
```