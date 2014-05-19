window.FullScreenMario = (function() {
    "use strict";
    
    // Use an EightBittr as the class parent, with EightBittr's constructor
    var EightBitter = new EightBittr(),
        
        // Used for combining arrays from the prototype to this
        proliferate = EightBitter.proliferate,
        proliferateHard = EightBitter.proliferateHard;
        
    console.warn("Still using global player object...");
    /**
     * 
     */
    function FullScreenMario() {    
                    "audio": "settings/audio.js",
                    "collisions": "settings/collisions.js",
                    "quadrants": "settings/quadrants.js",
                    "runner": "settings/runner.js",
                    "sprites": "settings/sprites.js",
                    "statistics": "settings/statistics.js"
                resetPixelRender,
                resetAudioPlayer,
                resetQuadsKeeper,
                resetGamesRunner,
                resetStatsHolder,
                resetThingHitter
            ],
            "constants": [
                "unitsize",
                "scale",
                "jumplev1",
                "jumplev2",
                "ceillev",
                "ceilmax",
                "castlev"
            ]
    FullScreenMario.prototype = EightBitter;
    
    // For the sake of reset functions, store constants as members of the actual
    // FullScreenMario function itself
    FullScreenMario.unitsize = 4;
    FullScreenMario.scale = 2;
    FullScreenMario.jumplev1 = 32;
    FullScreenMario.jumplev2 = 64;
    // The floor is 88 spaces (11 blocks) below the yloc = 0 level
    FullScreenMario.ceillev = 88; 
    // The floor is 104 spaces (13 blocks) below the top of the screen (yloc = -16)
    FullScreenMario.ceilmax = 104; 
    FullScreenMario.castlev = -48;
     *                          sprites.js (settings/sprites.js)
            "scale": self.scale
        }, self.sprites));
     *                          events.js (settings/events.js)
        self.TimeHandler = new TimeHandlr(self.events);
    
    /**
     * Sets self.AudioPlayer
     * 
     * @param {FullScreenMario} self
     * @remarks Requirement(s): AudioPlayr (src/AudioPlayr.js)
     *                          audio.js (settings/audio.js)
     */
    function resetAudioPlayer(self) {
        self.AudioPlayer = new AudioPlayr(self.audio);
    }
    
    /**
     * Sets self.QuadsKeeper
     * @remarks Requirement(s): QuadsKeepr (src/QuadsKeepr.js)
     *                          quadrants.js (settings/quadrants.js)
     */
    function resetQuadsKeeper(self) {
        self.QuadsKeeper = new QuadsKeepr(self.quadrants);
    }
    
    /**
     * Sets self.GamesRunner
     * @remarks Requirement(s): GamesRunnr (src/GamesRunnr.js)
     *                          runner.js (settings/runner.js)
     */
    function resetGamesRunner(self) {
        self.GamesRunner = new GamesRunnr(self.runner);
    }
    
    /**
     * Sets self.StatsHolder
     * @remarks Requirement(s): StatsHoldr (src/StatsHoldr.js)
     *                          statistics.js (settings/statistics.js)
     */
    function resetStatsHolder(self) {
        self.StatsHolder = new StatsHoldr(self.statistics);
    }
    
    /**
     * Sets self.ThingHitter
     * @remarks Requirement(s): ThingHittr (src/ThingHittr.js)
     *                          collisions.js (settings/collisions.js)
     */
    function resetThingHitter(self) {
        self.ThingHitter = new ThingHittr(proliferate({
            "scope": self
        }, self.collisions));
    }
    
    /**
     * Sets self.ObjectMaker
     * 
     * Because many Thing functions require access to other FSM modules, each is
     * given a reference to this container FSM via properties.Thing.EightBitter. 
     * 
     * @remarks Requirement(s): ObjectMakr (src/ObjectMakr.js)
     *                          things.js (settings/things.js)
     */
    function resetObjectMaker(self) {
        self.ObjectMaker = new ObjectMakr(proliferate({
            "properties": {
                "Thing": {
                    "EightBitter": self
                }
            }
        }, self.things));
    }
    
    
    /* Collision functions
    */

    /**
     * Generic checker for can_collide, used for both Solids and Characters
     * 
     * @param {Thing} thing
     * @return {Boolean}
     */
    function thingCanCollide(thing) {
        return thing.alive && !thing.nocollide;
    }

    /**
     * Generic base function to check if one thing is touching another
     * This will be called by the more specific thing touching functions
     * 
     * @param {Thing} thing
     * @param {Thing} other
     * @return {Boolean}
     * @remarks Only the horizontal checks use unitsize
     */
    function thingTouchesThing(thing, other) {
                && thing.right - this.unitsize > other.left
                && thing.left + this.unitsize < other.right
                && thing.bottom >= other.top
                && thing.top <= other.bottom;
    }
    
    /**
     * Is thing on top of other?
     * 
     * 
     * @remarks This is a more specific form of thingTouchesThing
     */
    function thingOnTop(thing, other) {
        // If thing is a solid and other is falling, thing can't be above other
        if(thing.grouptype === "Solid" && other.yvel > 0) {
            return false;
        }
        
        // If other is falling faster than thing, and isn't a solid,
        // thing can't be on top (if anything, the opposite is true)
        if(thing.yvel < other.yvel && other.grouptype !== "Solid") {
            return false;
        }
        
        // If thing is the player, and it's on top of an enemy, that's true
        if(thing.player && thing.bottom < other.bottom 
                && other.type === "enemy") {
            return true;
        }
        
        // If thing is too far to the right, it can't be touching other
        if(thing.left + this.unitsize >= other.right) {
            return false;
        }
        
        // If thing is too far to the left, it can't be touching other
        if(thing.right - this.unitsize <= other.left) {
            return false;
        }
        
        // If thing's bottom is below other's top, factoring tolerance and
        // other's vertical velocity, they're touching
        if(thing.bottom <= other.top + other.toly + other.yvel) {
            return true;
        }
        
        // Same as before, but with velocity as the absolute difference between
        // their two velocities
        if(thing.bottom <= other.top + other.toly
                + Math.abs(thing.yvel - other.yvel)) {
            return true;
        }
        
        // None of the above checks passed for true, so this is false (thing's
        // bottom is above other's top
        return false;
    }
    
    /**
     * 
     * 
     * @remarks Similar to thingOnTop, but more specifically used for
     *          characterOnSolid and characterOnResting
     */
    function thingOnSolid(thing, other) {
        // If thing is too far to the right, they're not touching
        if(thing.left + this.unitsize > other.right) {
            return false;
        }
        
        // If thing is too far to the left, they're not touching
        if(thing.right - this.unitsize < other.left) {
            return false;
        }
        
        // If thing's bottom is below other's top, factoring thing's velocity
        // and other's tolerance, they're touching
        if(thing.bottom - thing.yvel <= other.top + other.toly + thing.yvel) {
            return true;
        }
        
        // Same as before, but with velocity as the absolute difference between
        // their two velocities
        if(thing.bottom <= other.top + other.toly
                + Math.abs(thing.yvel - other.yvel)) {
            return true;
        }
        
        // None of the above checks passed for true, so this is false (thing's
        // bottom is above other's top
        return false;
    }
    
    /**
     * 
     */
    function characterOnSolid(character, solid) {
        // If character is resting on solid, this is automatically true
        if(character.resting === solid) {
            return true;
        }
        
        // The character and solid must be touching appropriately
        if(!this.thingOnSolid(character, solid)) {
            return false;
        }
        
        // Corner case: when character is exactly falling off the right (false)
        if(character.left + character.xvel + this.unitsize == solid.right) {
            return false;
        }
        
        // Corner case: when character is exactly falling off the left (false)
        if(character.right - character.xvel - this.unitsize == solid.left) {
            return false;
        }
        
        // None of the above checks caught a falsity, so this must be true
        return true;
    }
    
    /**
     * 
     */
    function characterOnResting(character, solid) {
        if(!this.thingOnSolid(character, solid)) {
            return false;
        }
        
        // Corner case: when character is exactly falling off the right (false)
        if(character.left + character.xvel + this.unitsize == solid.right) {
            return false;
        }
        
        // Corner case: when character is exactly falling off the left (false)
        if(character.right - character.xvel - this.unitsize == solid.left) {
            return false;
        }
        
        // None of the above checks caught a falsity, so this must be true
        return true;
    }
    
    /**
     * 
     * @param {Thing} thing
     * @param {Thing} other
     */
    function characterTouchesSolid(character, solid) {
        if(solid.hidden) {
        }
        
        return this.thingTouchesThing(character, solid);
    }

    /**
     * 
     * @param {Thing} thing
     * @param {Thing} other
     */
    function characterTouchesCharacter(thing, other) {
        
        return this.thingTouchesThing(thing, other);
    }

    /**
     * // thing = character
     * // other = solid
     * 
     * @param {Thing} thing
     * @param {Thing} other
     */
    function characterHitsSolid(thing, other) {
        // "Up" solids are special (they kill things that aren't their .up)
        if(other.up && thing !== other.up) {
            return characterTouchesUp(thing, other);
        }
        
        // Normally, call the generic ~TouchedSolid function
        (other.collide || characterTouchedSolid)(thing, other);
        
        // If a character is bumping into the bottom, call that
        if(thing.undermid) {
            if(thing.undermid.bottomBump) {
                thing.undermid.bottomBump(thing.undermid, thing);
            }
        }
        else if(thing.under && thing.under.bottomBump) {
            thing.under.bottomBump(thing.under, thing);
        }
    }

    /**
     *  
     * @param {Thing} thing
     * @param {Thing} other
     */
    function characterHitsCharacter(thing, other) {
        // The player calls the other's collide function, such as playerStar
        if(thing.player) {
            if(other.collide) {
                return other.collide(thing, other);
            }
        }
        // Otherwise just use thing's collide function
        else if(thing.collide) {
            thing.collide(other, thing);
        }
    }
    
    /**
     * 
     * 
     * @remarks Similar to thingOnTop, but more specifically used for
     *          characterTouchedSolid
     * @remarks This sets the character's .midx property
     */
    function solidOnCharacter(solid, character) {
        if(character.yvel >= 0) {
            return false;
        }
        
        // Horizontally, all that's required is for the character's midpoint to
        // be within the solid's left and right
        character.midx = this.getMidX(character);
        if(character.midx <= solid.left || character.midx >= solid.right) {
            return false;
        }
        
        // If the solid's bottom is below the character's top, factoring
        // tolerance and velocity, that's false (this function assumes they're
        // already touching)
        if(solid.bottom - solid.yvel
            return false;
        }
        return true;
    }
    

    /* Physics functions 
    */
    
    /**
     * 
     */
    function shiftBoth(thing, dx, dy) {
        if(!thing.noshiftx) {
            this.shiftHoriz(thing, dx);
        }
        if(!thing.noshifty) {
            this.shiftVert(thing, dy);
        }
    }

    /**
     * 
     */
    function setWidth(thing, width, update_sprite, update_size) {
        thing.unitwidth = width * this.unitsize;
        
        if(update_sprite) {
            thing.spritewidth = width;
            thing.spritewidthpixels = width * this.unitsize;
        }
        
        if(update_size) {
            this.updateSize(thing);
            // PixelDrawer.setThingSprite(thing);
            console.log("Should update thing canvas on setWidth", thing.title);
        }
    }
    
    /**
     * 
     */
    function setHeight(thing, height, update_sprite, update_size) {
        thing.height = height;
        thing.unitheight = height * this.unitsize;
        
        if(update_sprite) {
            thing.spriteheight = height;
            thing.spriteheightpixels = height * this.unitsize;
        }
        
        if(update_size) {
            this.updateSize(thing);
            // setThingSprite(thing);
            console.log("Should update thing canvas on setHeight", thing.title);
        }
    }
    
    /**
     * 
     */
    function setSize(thing, width, height, update_sprite, update_size) {
        this.setWidth(thing, width, update_sprite, update_size);
        this.setHeight(thing, height, update_sprite, update_size);
    }
    
    /**
     * 
     */
    function updatePosition(thing, hard) {
        if(!thing.nomove || hard) {
            this.shiftHoriz(thing, thing.xvel);
        }
        
        if(!thing.nofall || hard) {
            this.shiftVert(thing, thing.yvel);
        }
    }
    
    /**
     * 
     */
    function updateSize(thing) {
        thing.unitwidth = thing.width * this.unitsize;
        thing.unitheight = thing.height * this.unitsize;
        thing.spritewidthpixels = thing.spritewidth * this.unitsize;
        thing.spriteheightpixels = thing.spriteheight * this.unitsize;
        
        if(thing.canvas !== undefined) {
            thing.canvas.width = thing.spritewidthpixels;
            thing.canvas.height = thing.spriteheightpixels;
            this.PixelDrawer.setThingSprite(thing);
        }
    }
    
    /**
     * 
     */
    function reduceHeight(thing, dy, see) {
        thing.top += dy;
        thing.height -= dy / this.unitsize;
        
        if(see) {
            this.updateSize(thing);
        }
    }
    
    /**
     * 
     */
    function increaseHeight(thing, dy) {
        thing.top -= dy;
        thing.height += dy / this.unitsize;
        thing.unitheight = thing.height * this.unitsize;
    }
    
    
    /* Movement functions
    */
    
    /**
     * Base, generic movement function for simple characters. The Thing moves
     * at a constant rate in either the x or y direction, and switches direction
     * only if directed by the engine (e.g. when it hits a Solid)
     * 
     * @param {Thing} thing
     * @remarks thing.speed is the only required member attribute; .direction
     *          and .moveleft should be set by the game engine.
     *          * thing.direction - what direction it should be moving
     *          * thing.moveleft - what direction is actually is moving
     *          * thing.speed - the Thing's typical speed
     */
    function moveSimple(thing) {
        // If the thing is looking away from the intended direction, flip it
        if(thing.direction != thing.moveleft) {
            // thing.moveleft is truthy: it should now be looking to the right
            if(thing.moveleft) {
                thing.xvel = -thing.speed;
                if(!thing.noflip) {
                    unflipHoriz(thing);
                }
            }
            // thing.moveleft is falsy: it should now be looking to the left
            else {
                thing.xvel = thing.speed;
                if(!thing.noflip) {
                    flipHoriz(thing);
                }
            }
            thing.direction = thing.moveleft;
        }
    }
    
    /**
     * Extension of the moveSimple movement function for Things that shouldn't
     * fall off the edge of their resting blocks
     * @param {Thing} thing
     */
    function moveSmart(thing) {
        // Start off by calling moveSimple for normal movement
        moveSimple(thing);
        
        // If this isn't resting, it's the same as moveSimple
        if(!thing.resting) {
            return;
        }
        
        // Check for being over the edge in the direction of movement
        if(thing.moveleft) {
            if(thing.left + this.unitsize <= thing.resting.left) {
                shiftHoriz(thing, this.unitsize);
                thing.moveleft = false;
            }
        } else {
            if(thing.right - this.unitsize >= thing.resting.right) {
                shiftHoriz(thing, -this.unitsize);
                thing.moveleft = true;
            }
        }
    }
    
    /**
     * Extension of the moveSimple movement function for Things that should
     * jump whenever they hit a resting block.
     * @param {Thing} thing
     * @remarks thing.jumpheight is required to know how high to jump
     */
    function moveJumping(thing) {
        // Start off by calling moveSimple for normal movement
        moveSimple(thing);
        
        // If .resting, jump!
        if(thing.resting) {
            thing.yvel = -Math.abs(thing.jumpheight);
            thing.resting = false;
        }
    }
    
    /**
     * Initial movement function for Things that float up and down (vertically).
     * This uses map_settings - in the future, it should just be relative
     * to the starting yloc of the Thing
     * 
     * @param {Thing} thing
     * @remarks thing.begin and thing.end are used as the vertical endpoints;
     *          .begin is the bottom and .end is the top (since begin <= end)
     */
    function moveFloating(thing) {
        // Make sure thing.begin <= thing.end
        setPlatformEndpoints(thing);
        
        // Make thing.begin and thing.end relative to map_settings.floor
        console.warn("moveFloating should avoid using map_settings");
        thing.begin = map_settings.floor * this.unitsize - thing.begin;
        thing.end = map_settings.floor * this.unitsize - thing.end;
        
        // Use moveFloatingReal as the actual movement function from now on
        (thing.movement = moveFloatingReal)(thing);
    }
    
    /**
     * Actual movement function for Things that float up and down (vertically).
     * If the Thing has reached thing.begin or thing.end, it gradually switches
     * thing.yvel
     * 
     * @param {Thing} thing
     * @remarks thing.maxvel is used as the maximum absolute speed vertically
     */
    function moveFloatingReal(thing) {
        // If above the endpoint:
        if(thing.top <= thing.end) {
            thing.yvel = Math.min(thing.yvel + this.unitsize / 32, thing.maxvel);
        }
        // If below the endpoint:
        else if(thing.bottom >= thing.begin) {
            thing.yvel = Math.max(thing.yvel - this.unitsize / 32, -thing.maxvel);
        }
        
        // Deal with velocities and whether the player is resting on this
        movePlatform(thing);
    }
    
    /**
     * Initial movement function for Things that float sideways (horizontally).
     * 
     * @param {Thing} thing
     * @remarks thing.begin and thing.end are used as the horizontal endpoints;
     *          .begin is the left and .end is the right (since begin <= end)
     */
    function moveSliding(thing) {
        // Make sure thing.begin <= thing.end
        setPlatformEndpoints(thing);
        
        // Use moveSlidingReal as the actual movement function from now on
        (thing.movement = moveSlidingReal)(thing);
    }
    
    /**
     * Actual movement function for Things that float sideways (horizontally).
     * If the Thing has reached thing.begin or thing.end, it gradually switches
     * thing.xvel
     * This uses gamescreen - in the future, it should just be relative
     * to the starting yloc of the Thing
     * 
     * @param {Thing} thing
     * @remarks thing.maxvel is used as the maximum absolute speed horizontally
     */
    function moveSlidingReal(thing) {
        // If to the left of the endpoint:
        if(gamescreen.left + thing.left <= thing.begin) {
            thing.xvel = Math.min(thing.xvel + this.unitsize / 32, thing.maxvel);
        }
        // If to the right of the endpoint:
        else if(gamescreen.left + thing.right > thing.end) {
            thing.xvel = Math.max(thing.xvel - this.unitsize / 32, -thing.maxvel);
        }
        
        // Deal with velocities and whether the player is resting on this
        movePlatform(thing);
    }
    
    /**
     * Ensures thing.begin <= thing.end (so there won't be glitches pertaining
     * to them in functions like moveFloating and moveSliding
     * 
     * @param {Thing} thing
     */
    function setPlatformEndpoints(thing) {
        if(thing.begin > thing.end) {
            var temp = thing.begin;
            thing.begin = thing.end;
            thing.end = temp;
        }
    }
    
    /**
     * Moves a platform by its velocities, and checks for whether the player
     * is resting on it (if so, the player must be moved accordingly)
     * This uses gamescreen, innerWidth, and player - in the future, it should 
     * get it them in some official manner? (or relegate that check to upkeep)
     * 
     * @param {Thing} thing
     */
    function movePlatform(thing) {
        shiftHoriz(thing, thing.xvel);
        shiftVert(thing, thing.yvel);
        
        // If the player is resting on this and this is alive, move the player
        if(thing === player.resting && player.alive) {
            setBottom(player, thing.top);
            shiftHoriz(player, thing.xvel);
            
            // If the player is too far to the right or left, stop that overlap
            if(player.right > innerWidth) {
                setRight(player, innerWidth);
            } else if(player.left < 0) {
                setLeft(player, 0);
            }
        }
    }
    
    
    /* Appearance utilities
    */
    
    /**
     * 
     */
    function setTitle(thing, string) {
        thing.title = string;
        thing.EightBitter.PixelDrawer.setThingSprite(thing);
    }
    
    /**
     * 
     */
    function setClass(thing, string) {
        thing.className = string;
        thing.EightBitter.PixelDrawer.setThingSprite(thing);
    }
    
    /**
     * 
     */
    function setClassInitial(thing, string) {
        thing.className = string;
    }
    
    /**
     * 
     */
    function addClass(thing, string) {
        thing.className += " " + string;
        thing.EightBitter.PixelDrawer.setThingSprite(thing);
    }
    
    /**
     * 
     */
    function addClasses(thing) {
        var strings, arr, i, j;
        for(i = 1; i < arguments.length; i += 1) {
            arr = arguments[i];
            
            if(!(arr instanceof Array)) {
                arr = arr.split(' ');
            }
            
            for(j = arr.length - 1; j >= 0; j -= 1) {
                addClass(thing, arr[j]);
            }
        }
    }
    
    /**
     * 
     */
    function removeClass(thing, string) {
        if(!string) {
            return;
        }
        if(string.indexOf(' ') !== -1) {
            removeClasses(thing, string);
        }
        thing.className = thing.className.replace(new RegExp(" " + string, "gm"), "");
        thing.EightBitter.PixelDrawer.setThingSprite(thing);
    }
    
    /**
     * 
     */
    function removeClasses(thing) {
        // var strings, arr, i, j;
        // for(i = 1; i < arguments.length; i += 1) {
            // arr = arguments[i];
            
            // if(!(arr instanceof Array)) {
                // arr = arr.split(' ');
            // }
            
            // for(j = arr.length - 1; j >= 0; j -= 1) {
                // removeClass(thing, arr[j]);
            // }
        // }
        
      var strings, arr, i, j;
      for(i = 1; i < arguments.length; ++i) {
        arr = arguments[i];
        if(!(arr instanceof Array)) arr = arr.split(" ");
        for(j = arr.length - 1; j >= 0; --j)
          removeClass(thing, arr[j]);
      }
    }
    
    /**
     * 
     */
    function switchClass(thing, string_out, string_in) {
        removeClass(thing, string_out);
        addClass(thing, string_in);
    }
    
    /**
     * 
     */
    function flipHoriz(thing) {
        addClass(thing, "flipped");
    }
    
    /**
     * 
     */
    function flipVert(thing) {
        addClass(thing, "flip-vert");
    }
    
    /**
     * 
     */
    function unflipHoriz(thing) {
        removeClass(thing, "flipped");
    }
    
    /**
     * 
     */
    function unflipVert(thing) {
        removeClass(thing, "flip-vert");
    }
    
    
    /* Death functions
    */
    
    /**
     * 
     */
    function killNormal(thing) {
        if(!thing) {
            return;
        }
        
        thing.hidden = thing.dead = true;
        thing.alive = thing.resting = thing.movement = false;
        
        if(thing.EightBitter) {
            thing.EightBitter.TimeHandler.clearAllCycles(thing);
        }
    }
    
    /**
     * 
     */
    function killFlip(thing, extra) {
        this.flipVert(thing);
        
        if(!extra) {
            extra = 0;
        }
        
        if(thing.bottomBump) {
            thing.bottomBump = undefined;
        }
        
        thing.nocollide = thing.dead = true;
        thing.resting = thing.movement = thing.speed = thing.xvel = thing.nofall = false;
        thing.yvel -= unitsize;
        thing.EightBitter.TimeHandler.addEvent(killNormal, 70 + extra, thing);
    }
    
    /**
     * Wipes the sccreen of any characters or solids that should be gone during
     * an important cutscene, such as hitting an end-of-level flag.
     * For characters, they're deleted if .nokillonend isn't truthy. If they
     * have a .killonend function, that's called on them.
     * Solids are only deleted if their .killonend is true.
     * 
     * @todo   Rename .killonend to be more accurate
     * @remarks If thing.killonend is a function, it is called on the thing.
     */
    function killNPCs() {
        var holder = this.ThingHitter.getGroupHolder(),
            group, thing, i;
        
        // Characters: they must opt out of being killed with .nokillonend, and
        // may opt into having a function called instead (such as Lakitus).
        group = holder.getCharacterGroup();
        for(i = group.length - 1; i >= 0; --i) {
            thing = group[i];
            
            if(!thing.nokillend) {
                this.deleteThing(thing, group, i);
            } else if(thing.killonend) {
                thing.killonend(thing);
            }
        }
        
        // Solids: they may opt into being deleted
        group = holder.getSolidGroup();
        for(i = group.length - 1; i >= 0; --i) {
            thing = group[i];
            
            if(thing.killonend) {
                this.deleteThing(thing, group, i);
            }
        }
    }
    
    
    // Add all registered functions from above to the FullScreenMario prototype
    proliferateHard(FullScreenMario.prototype, {
        // Collisions
        "thingCanCollide": thingCanCollide,
        "thingTouchesThing": thingTouchesThing,
        "thingOnTop": thingOnTop,
        "thingOnSolid": thingOnSolid,
        "characterTouchesSolid": characterTouchesSolid,
        "characterTouchesCharacter": characterTouchesCharacter,
        "characterHitsSolid": characterHitsSolid,
        "characterHitsCharacter": characterHitsCharacter,
        "characterOnSolid": characterOnSolid,
        "characterOnResting": characterOnResting,
        "solidOnCharacter": solidOnCharacter,
        // Movement
        "moveSimple": moveSimple,
        "moveSmart": moveSmart,
        "moveJumping": moveJumping,
        "moveFloating": moveFloating,
        "moveFloatingReal": moveFloatingReal,
        "moveSliding": moveSliding,
        "moveSlidingReal": moveSlidingReal,
        "movePlatform": movePlatform,
        // Physics
        "shiftBoth": shiftBoth,
        "setWidth": setWidth,
        "setHeight": setHeight,
        "setSize": setSize,
        "updatePosition": updatePosition,
        "updateSize": updateSize,
        "reduceHeight": reduceHeight,
        "increaseHeight": increaseHeight,
        // Appearance utilities
        "setTitle": setTitle,
        "setClass": setClass,
        "setClassInitial": setClassInitial,
        "addClass": addClass,
        "addClasses": addClasses,
        "removeClass": removeClass,
        "removeClasses": removeClasses,
        "switchClass": switchClass,
        "flipHoriz": flipHoriz,
        "flipVert": flipVert,
        "unflipHoriz": unflipHoriz,
        "unflipVert": unflipVert,
        // Death functions
        "killNormal": killNormal,
        "killFlip": killFlip
    });
    
    return FullScreenMario;
})();