interface IInputWritrSettings {
  // The mapping of events to their key codes to their callbacks.
  triggers: any;

  // The first argument to be passed to event callbacks.
  eventInformation?: any;

  // A Function to return the current time as a Number. If not provided, all
  // variations of performance.now are tried; if they don't exist, Date.now
  // is used.
  getTimestamp?: any;

  // Known, allowed aliases for triggers.
  aliases?: any;

  keyAliasesToCodes?: any;
  keyCodesToAliases?: any;

  // Whether events are initially allowed to trigger (by default, true).
  canTrigger?: boolean;

  // Whether triggered inputs are initally allowed to be written to history
  // (defaults to true).
  isRecording?: boolean;
}

/**
 * InputWritr
 * A general utility for automating interactions with user-called events linked
 * with callbacks. Pipe functions are available that take in user input, switch
 * on the event code, and call the appropriate callback. These Pipe functions
 * can be made during runtime; further utilities allow for saving and playback
 * of input histories in JSON format.
 * @example
 * // Creating and using an InputWritr to log keystrokes on the 'a' key.
 * var InputWriter = new InputWritr({
 *     "triggers": {
 *         "onkeydown": {
 *             "65": function () : void {
 *                 console.log("Hello!");
 *             }
 *         }
 *     }
 * });
 * document.body.onkeydown = InputWriter.makePipe("onkeydown", "keyCode");
 * @example
 * // Creating and using an InputWritr to simulate WASD arrow controls.
 * var InputWriter = new InputWritr({
 *     "triggers": {
 *         "aliases": {
 *             "up": [87, 38],    // w, up
 *             "right": [68, 39], // d, right
 *             "down": [83, 40],  // s, down
 *             "left": [65, 37],  // a, left
 *         },
 *         "onkeydown": {
 *             "up": console.log.bind(console, "up"),
 *             "right": console.log.bind(console, "right"),
 *             "down": console.log.bind(console, "down"),
 *             "left": console.log.bind(console, "left"),
 *         }
 *     }
 * });
 * document.body.onkeydown = InputWriter.makePipe("onkeydown", "keyCode");
 * @author "Josh Goldberg" <josh@fullscreenmario.com>
 */
class InputWritr {
  // A mapping of events to their key codes to their callbacks.
  private triggers: any;

  // Known, allowed aliases for triggers.
  private aliases: any;

  // A listing of every action that has happened, with a timestamp.
  private history: any;

  // A listing of all histories, with indices set by this.saveHistory.
  private histories: any;

  // For compatibility, a reference to performance.now() or an equivalent.
  private getTimestamp: any;

  // A starting time used for calculating playback delays in playHistory.
  private startingTime: number;

  // An object to be passed to event calls, commonly with key information.
  // (such as "Down" => 0 }
  private eventInformation: any;

  // An optional boolean callback to disable or enable input triggers.
  private canTrigger: any;

  // Whether to record events into the history
  private isRecording: boolean;

  // A quick lookup table of key aliases to their character codes.
  private keyAliasesToCodes: any;

  // A quick lookup table of character codes to their key aliases.
  private keyCodesToAliases: any;

  /**
   * Resests the InputWritr.
   *
   * @constructor
   * @param {IInputWritrSettings} settings
   */
  constructor(settings: IInputWritrSettings) {
    if (!settings.triggers) {
      throw new Error("No triggers given to InputWritr.");
    }
    this.triggers = settings.triggers;
    // Headless browsers like PhantomJS might not know performance, so
    // Date.now is used as a backup
    if (typeof settings.getTimestamp === "undefined") {
      if (typeof performance === "undefined") {
        this.getTimestamp = function (): number {
          return Date.now();
        };
      } else {
        this.getTimestamp = (
          performance.now ||
          (<any>performance).webkitNow ||
          (<any>performance).mozNow ||
          (<any>performance).msNow ||
          (<any>performance).oNow
        ).bind(performance);
      }
    } else {
      this.getTimestamp = settings.getTimestamp;
    }

    this.eventInformation = settings.eventInformation;

    this.canTrigger = settings.hasOwnProperty("canTrigger")
      ? settings.canTrigger
      : true;
    this.isRecording = settings.hasOwnProperty("isRecording")
      ? settings.isRecording
      : true;

    this.history = {};
    this.histories = {
      length: 0,
    };
    this.aliases = {};

    this.addAliases(settings.aliases || {});

    this.keyAliasesToCodes = settings.keyAliasesToCodes || {
      shift: 16,
      ctrl: 17,
      space: 32,
      left: 37,
      up: 38,
      right: 39,
      down: 40,
    };

    this.keyCodesToAliases = settings.keyCodesToAliases || {
      "16": "shift",
      "17": "ctrl",
      "32": "space",
      "37": "left",
      "38": "up",
      "39": "right",
      "40": "down",
    };
  }

  /**
   * Clears the currently tracked inputs history and resets the starting time,
   * and (optionally) saves the current history.
   *
   * @param {Boolean} [keepHistory]   Whether the currently tracked history
   *                                  of inputs should be added to the master
   *                                  Array of histories (defaults to true).
   */
  restartHistory(keepHistory: boolean = true): void {
    if (keepHistory) {
      this.saveHistory(this.history);
    }

    this.history = {};
    this.startingTime = this.getTimestamp();
    //console.log("restartHistory!", this.startingTime);
  }

  /* Simple gets
   */

  /**
   * @return {Object} The stored mapping of aliases to values.
   */
  getAliases(): any {
    return this.aliases;
  }

  /**
   * @return {Object} The stored mapping of aliases to values, with values
   *                  mapped to their equivalent key Strings.
   */
  getAliasesAsKeyStrings(): any {
    var output: any = {},
      alias: string;

    for (alias in this.aliases) {
      if (this.aliases.hasOwnProperty(alias)) {
        output[alias] = this.getAliasAsKeyStrings(alias);
      }
    }

    return output;
  }

  /**
   * @param {Mixed} alias   An alias allowed to be passed in, typically a
   *                        character code.
   * @return {String[]}   The mapped key Strings corresponding to that alias,
   *                      typically the human-readable Strings representing
   *                      input names, such as "a" or "left".
   */
  getAliasAsKeyStrings(alias: any): string[] {
    return this.aliases[alias].map(this.convertAliasToKeyString.bind(this));
  }

  /**
   * @param {Mixed} alias   The alias of an input, typically a character
   *                        code.
   * @return {String} The human-readable String representing the input name,
   *                  such as "a" or "left".
   */
  convertAliasToKeyString(alias: any): string {
    if (alias.constructor === String) {
      return alias;
    }

    if (alias > 96 && alias < 105) {
      return String.fromCharCode(alias - 48);
    }

    if (alias > 64 && alias < 97) {
      return String.fromCharCode(alias);
    }

    return typeof this.keyCodesToAliases[alias] !== "undefined"
      ? this.keyCodesToAliases[alias]
      : "?";
  }

  /**
   * @param {Mixed} key   The number code of an input.
   * @return {Number} The machine-usable character code of the input.
   *
   */
  convertKeyStringToAlias(key: number | string): number | string {
    if (key.constructor === Number) {
      return key;
    }

    if ((<string>key).length === 1) {
      return (<string>key).charCodeAt(0) - 32;
    }

    return typeof this.keyAliasesToCodes[<string>key] !== "undefined"
      ? this.keyAliasesToCodes[<string>key]
      : -1;
  }

  /**
   * Get function for a single history, either the current or a past one.
   *
   * @param {String} [name]   The identifier for the old history to return. If
   *                          none is provided, the current history is used.
   * @return {Object}   A history of inputs in JSON-friendly form.
   */
  getHistory(name: string = undefined): any {
    return arguments.length ? this.histories[name] : history;
  }

  /**
   * @return {Object} All previously stored histories.
   */
  getHistories(): any {
    return this.histories;
  }

  /**
   * @return {Boolean} Whether this is currently allowing inputs.
   */
  getCanTrigger(): boolean {
    return this.canTrigger;
  }

  /**
   * @return {Boolean} Whether this is currently recording allowed inputs.
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /* Simple sets
   */

  /**
   * @param {Mixed} canTriggerNew   Whether this is now allowing inputs. This
   *                                may be either a Function (to be evaluated
   *                                on each input) or a general Boolean.
   */
  setCanTrigger(canTriggerNew: boolean | Function): void {
    if (canTriggerNew.constructor === Boolean) {
      this.canTrigger = function (): boolean {
        return <boolean>canTriggerNew;
      };
    } else {
      this.canTrigger = <boolean>canTriggerNew;
    }
  }

  /**
   * @param {Boolean} isRecordingNew   Whether this is now recording allowed
   *                                   inputs.
   */
  setIsRecording(isRecordingNew: boolean): void {
    this.isRecording = isRecordingNew;
  }

  /**
   * @param {Mixed} eventInformationNew   A new first argument for event
   *                                      callbacks.
   */
  setEventInformation(eventInformationNew: any): void {
    this.eventInformation = eventInformationNew;
  }

  /* Aliases
   */

  /**
   * Adds a list of values by which an event may be triggered.
   *
   * @param {String} name   The name of the event that is being given
   *                        aliases, such as "left".
   * @param {Array} values   An array of aliases by which the event will also
   *                         be callable.
   */
  addAliasValues(name: any, values: any[]): void {
    var triggerName: any, triggerGroup: any, i: number;

    if (!this.aliases.hasOwnProperty(name)) {
      this.aliases[name] = values;
    } else {
      this.aliases[name].push.apply(this.aliases[name], values);
    }

    // triggerName = "onkeydown", "onkeyup", ...
    for (triggerName in this.triggers) {
      if (this.triggers.hasOwnProperty(triggerName)) {
        // triggerGroup = { "left": function, ... }, ...
        triggerGroup = this.triggers[triggerName];

        if (triggerGroup.hasOwnProperty(name)) {
          // values[i] = 37, 65, ...
          for (i = 0; i < values.length; i += 1) {
            triggerGroup[values[i]] = triggerGroup[name];
          }
        }
      }
    }
  }

  /**
   * Removes a list of values by which an event may be triggered.
   *
   * @param {String} name   The name of the event that is having aliases
   *                        removed, such as "left".
   * @param {Array} values   An array of aliases by which the event will no
   *                         longer be callable.
   */
  removeAliasValues(name: string, values: any[]): void {
    var triggerName: any, triggerGroup: any, i: number;

    if (!this.aliases.hasOwnProperty(name)) {
      return;
    }

    for (i = 0; i < values.length; i += 1) {
      this.aliases[name].splice(this.aliases[name].indexOf(values[i], 1));
    }

    // triggerName = "onkeydown", "onkeyup", ...
    for (triggerName in this.triggers) {
      if (this.triggers.hasOwnProperty(triggerName)) {
        // triggerGroup = { "left": function, ... }, ...
        triggerGroup = this.triggers[triggerName];

        if (triggerGroup.hasOwnProperty(name)) {
          // values[i] = 37, 65, ...
          for (i = 0; i < values.length; i += 1) {
            if (triggerGroup.hasOwnProperty(values[i])) {
              delete triggerGroup[values[i]];
            }
          }
        }
      }
    }
  }

  /**
   * Shortcut to remove old alias values and add new ones in.
   *
   *
   * @param {String} name   The name of the event that is having aliases
   *                        added and removed, such as "left".
   * @param {Array} valuesOld   An array of aliases by which the event will no
   *                            longer be callable.
   * @param {Array} valuesNew   An array of aliases by which the event will
   *                            now be callable.
   */
  switchAliasValues(name: string, valuesOld: any[], valuesNew: any[]): void {
    this.removeAliasValues(name, valuesOld);
    this.addAliasValues(name, valuesNew);
  }

  /**
   * Adds a set of alises from an Object containing "name" => [values] pairs.
   *
   * @param {Object} aliasesRaw
   */
  addAliases(aliasesRaw: any): void {
    for (var aliasName in aliasesRaw) {
      if (aliasesRaw.hasOwnProperty(aliasName)) {
        this.addAliasValues(aliasName, aliasesRaw[aliasName]);
      }
    }
  }

  /* Functions
   */

  /**
   * Adds a triggerable event by marking a new callback under the trigger's
   * triggers. Any aliases for the label are also given the callback.
   *
   * @param {String} trigger   The name of the triggered event.
   * @param {Mixed} label   The code within the trigger to call within,
   *                        typically either a character code or an alias.
   * @param {Function} callback   The callback Function to be triggered.
   */
  addEvent(trigger: string, label: any, callback: any): void {
    var i: number;

    if (!this.triggers.hasOwnProperty(trigger)) {
      throw new Error("Unknown trigger requested: '" + trigger + "'.");
    }

    this.triggers[trigger][label] = callback;

    if (this.aliases.hasOwnProperty(label)) {
      for (i = 0; i < this.aliases[label].length; i += 1) {
        this.triggers[trigger][this.aliases[i]] = callback;
      }
    }
  }

  /**
   * Removes a triggerable event by deleting any callbacks under the trigger's
   * triggers. Any aliases for the label are also given the callback.
   *
   * @param {String} trigger   The name of the triggered event.
   * @param {Mixed} label   The code within the trigger to call within,
   *                        typically either a character code or an alias.
   */
  removeEvent(trigger: string, label: any): void {
    var i: number;

    if (!this.triggers.hasOwnProperty(trigger)) {
      throw new Error("Unknown trigger requested: '" + trigger + "'.");
    }

    delete this.triggers[trigger][label];

    if (this.aliases.hasOwnProperty(label)) {
      for (i = 0; i < this.aliases[label].length; i += 1) {
        if (this.triggers[trigger][this.aliases[i]]) {
          delete this.triggers[trigger][this.aliases[i]];
        }
      }
    }
  }

  /**
   * Stores the current history in the histories listing. this.restartHistory
   * is typically called directly after.
   */
  saveHistory(name: string = undefined): void {
    this.histories[this.histories.length] = history;
    this.histories.length += 1;
    if (arguments.length) {
      this.histories[name] = history;
    }
  }

  /**
   * Plays back the current history using this.playEvents.
   */
  playHistory(): void {
    this.playEvents(this.history);
  }

  /**
   * "Plays" back an Array of event information by simulating each keystroke
   * in a new call, timed by setTimeout.
   *
   * @param {Object} events   The events history to play back.
   * @remarks This will execute the same actions in the same order as before,
   *          but the arguments object may be different.
   */
  playEvents(events: any): void {
    var timeouts: any = {},
      time: string,
      call: Function;

    for (time in events) {
      if (events.hasOwnProperty(time)) {
        call = this.makeEventCall(events[time]);
        timeouts[time] = setTimeout(
          call,
          (Number(time) - this.startingTime) | 0
        );
      }
    }
  }

  /**
   * Curry utility to create a closure that runs call() when called.
   *
   * @param {Array} info   An array containing [alias, keycode].
   * @return {Function} A closure Function that activates a trigger
   *                    when called.
   */
  makeEventCall(info: any[]): Function {
    return function (): void {
      this.callEvent(info[0], info[1]);
    };
  }

  /**
   * Primary driver function to run an event. The event is chosen from the
   * triggers object, and called with eventInformation as the input.
   *
   * @param {Function, String} event   The event function (or string alias of
   *                                   it) that will be called.
   * @param {Number} [keycode]   The alias of the event function under
   *                             triggers[event], if event is a String.
   * @param {Event} [sourceEvent]   The raw event that caused the calling Pipe
   *                                to be triggered, such as a MouseEvent.
   * @return {Mixed}
   */
  callEvent(
    event: Function | string,
    keycode: number = undefined,
    sourceEvent: Event = undefined
  ): any {
    if (this.canTrigger.constructor === Boolean) {
      if (!this.canTrigger) {
        return;
      }
    } else if (this.canTrigger.constructor === Function) {
      if (!this.canTrigger(event, keycode)) {
        return;
      }
    }

    if (!event) {
      throw new Error("Blank event given, ignoring it.");
    }

    if (event.constructor === String) {
      event = this.triggers[<string>event][keycode];
    }

    return (<any>event)(this.eventInformation, sourceEvent);
  }

  /**
   * Creates and returns a function to run a trigger.
   *
   * @param {String} trigger   The label for the Array of functions that the
   *                           pipe function should choose from.
   * @param {String} codeLabel   A mapping String for the alias to get the
   *                             alias from the event.
   * @param {Boolean} [preventDefaults]   Whether the input to the pipe
   *                                       function will be an HTML-style
   *                                       event, where .preventDefault()
   *                                       should be clicked.
   * @return {Function}
   * @example   Creating a function that calls an onKeyUp event, with a given
   *            input's keyCode being used as the codeLabel.
   *            InputWriter.makePipe("onkeyup", "keyCode");
   * @example   Creating a function that calls an onMouseDown event, and
   *            preventDefault of the argument.
   *            InputWriter.makePipe("onmousedown", null, true);
   */
  makePipe(
    trigger: string,
    codeLabel: string,
    preventDefaults: boolean = undefined
  ): Function {
    var functions: any = this.triggers[trigger],
      InputWriter: InputWritr = this;

    if (!functions) {
      throw new Error("No trigger of label '" + trigger + "' defined.");
    }

    return function Pipe(event: Event): void {
      var alias: any = event[codeLabel];

      // Typical usage means alias will be an event from a key/mouse input
      if (preventDefaults && event.preventDefault instanceof Function) {
        event.preventDefault();
      }

      // If there's a function under that alias, run it
      if (functions.hasOwnProperty(alias)) {
        if (InputWriter.isRecording) {
          InputWriter.history[InputWriter.getTimestamp() | 0] = [
            trigger,
            alias,
          ];
        }

        InputWriter.callEvent(functions[alias], <number>alias, event);
      }
    };
  }
}
