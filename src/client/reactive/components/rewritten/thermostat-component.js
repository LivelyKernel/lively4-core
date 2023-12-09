"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import { proceed, Layer } from 'src/client/ContextJS/src/Layers.js';

export default class Thermostat extends Morph {
  async initialize() {
    this.windowTitle = "Thermostat";
    this.aexprs = [];
    this.celsius = 20;

    this.increase.addEventListener("click", () => {
      this.increaseTemperature();
    });
    this.reduce.addEventListener("click", () => {
      this.reduceTemperature();
    });
    always: this.temperature.textContent = this.temperatureString();

    always: this.useCelsius = this.celsiusMode.checked;
    this.setupLayer();

    this.fahrenheitLayer.activeWhile(() => !this.useCelsius);
    
    this.replaceMigratableAEs();
    // always: this.fahrenheit = Math.round(this.celsius * 9 / 5 + 32);
    // always: this.celsius = Math.round((this.fahrenheit - 32) / 9 * 5);
  }

  increaseTemperature() {
    this.celsius++;
  }

  reduceTemperature() {
    this.celsius--;
  }

  temperatureString() {
    return this.celsius + "°C";
  }

  setupLayer() {
    this.fahrenheitLayer = new Layer("Fahrenheit");
    this.fahrenheitLayer.refineObject(this, {
      increaseTemperature() {
        this.fahrenheit++;
      },
      reduceTemperature() {
        this.fahrenheit--;
      },
      temperatureString() {
        return this.fahrenheit + "°F ";
      }
    });
    
    this.fahrenheitLayer.onActivate(() => {
      lively.notify('use °F')
      this.fahrenheit = Math.round(this.celsius * 9 / 5 + 32);
    });
    this.fahrenheitLayer.onDeactivate(() => {
      lively.notify('use °C')
      this.celsius = Math.round((this.fahrenheit - 32) / 9 * 5);
    });
  }

  get reduce() {
    return this.get("#reduce");
  }

  get temperature() {
    return this.get("#temperature");
  }

  get increase() {
    return this.get("#increase");
  }

  get celsiusMode() {
    return this.get("#celsiusMode");
  }

  async livelyExample() {}

  registerDatabinding(aexpr, name) {
    this.aexprs.push(aexpr);
  }

  livelyPreMigrate(other) {
    this.disposeBindings();
  }

  livelyMigrate(other) {
    this.migratedAexprs = other.aexprs;
    this.migratedLayer = other.fahrenheitLayer;
    this.celcius = other.celcius;
    this.fahrenheit = other.fahrenheit;
    this.celsiusMode.checked = other.celsiusMode.checked;
  }

  replaceMigratableAEs() {
    if (!this.migratedAexprs) return;
    if (this.migratedAexprs.length === this.aexprs.length) {
      for (let i = 0; i < this.aexprs.length; i++) {
        const ae = this.aexprs[i],
              migrated = this.migratedAexprs[i];
        if (ae.func.toString() === migrated.func.toString()) {
          ae.migrateEvents(migrated);
        }
      }
    }
    this.migratedAexprs = undefined;
    this.fahrenheitLayer.AExprForILA.migrateEvents(this.migratedLayer.AExprForILA);
  }

  disconnectedCallback() {
    this.disposeBindings();
  }

  disposeBindings() {
    this.fahrenheitLayer.remove();
    this.aexprs.forEach(ae => ae.dispose());
  }
}