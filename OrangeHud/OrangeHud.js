/*=============================================================================
 * Orange - HUD 
 * By HUDell - www.hudell.com
 * OrangeHud.js
 * Version: 1.1
 * Free for commercial and non commercial use.
 *=============================================================================*/
/*:
 * @plugindesc Creates a custom HUD based on the params
 *
 * @author Hudell
 *
 * @param DefaultFontFace
 * @desc The font face to use by default
 * @default Verdana
 *
 * @param DefaultFontSize
 * @desc The font size to use by default
 * @default 18
 *
 * @param DefaultFontColor
 * @desc The font color to use by default
 * @default #FFFFFF
 *
 * @param DefaultFontItalic
 * @desc Should use italic by default?
 * @default false
 *
 * @param HudWidth
 * @desc The width of the hud. 0 == 100%
 * @default 0
 *
 * @param HudHeight
 * @desc The height of the hud. 0 == 100%
 * @default 0
 *
 * @param HudX
 * @desc The X position of the hud
 * @default 0
 *
 * @param HudY
 * @desc The Y position of the hud
 * @default 0
 *
 * @param HudOpacity
 * @desc The Opacity of the hud
 * @default 0
 *
 * @param SwitchId
 * @desc Number of a switch to hide / show the hud
 * @default 0
 *
 * @help
 * ============================================================================
 * Latest Version
 * ============================================================================
 * 
 * Get the latest version of this script on
 * http://link.hudell.com/hud
 * 
 *=============================================================================*/
var Imported = Imported || {};

if (Imported['MVCommons'] === undefined) {
  console.log('Download MVCommons: http://link.hudell.com/mvcommons');
  throw new Error("This library needs MVCommons to work properly!");
}

var OrangeHud = OrangeHud || {};

var Window_OrangeHud = MVC.extend(Window_Base);

(function($) {
  "use strict";

  $.Parameters = PluginManager.parameters('OrangeHud');
  $.Param = $.Param || {};

  $.Param.DefaultFontSize = Number($.Parameters.DefaultFontSize || 18);
  $.Param.DefaultFontColor = String($.Parameters.DefaultFontColor || '#FFFFFF');
  $.Param.DefaultFontItalic = $.Parameters.DefaultFontItalic === "true";

  $.Param.HudWidth = Number($.Parameters.HudWidth || SceneManager._screenWidth);
  if ($.Param.HudWidth === 0) {
    $.Param.HudWidth = SceneManager._screenWidth;
  }
  $.Param.HudHeight = Number($.Parameters.HudHeight || SceneManager._screenHeight);
  if ($.Param.HudHeight === 0) {
    $.Param.HudHeight = SceneManager._screenHeight;
  }
  $.Param.HudX = Number($.Parameters.HudX || 0);
  $.Param.HudY = Number($.Parameters.HudY || 0);
  $.Param.HudOpacity = Number($.Parameters.HudOpacity || 0);

  $.Param.SwitchId = Number($.Parameters.SwitchId || 0);

  $.Param.LineList = PluginManager.getParamList('OrangeHudLine');

  $._lines = {};

  // Validate Params
  for (var i = 0; i < $.Param.LineList.length; i++) {
    var line = $.Param.LineList[i];

    if (line.ScriptPattern !== undefined && line.ScriptPattern.trim() === "") {
      line.ScriptPattern = undefined;
    }

    if (line.Pattern === undefined) {
      line.Pattern = "%1";
    } else if (line.Pattern.trim() === "") {
      line.Pattern = "";
    }

    line.VariableId = Number(line.VariableId || 0);
    if (line.FontFace === undefined || line.FontFace.trim() === "") {
      line.FontFace = $.Param.DefaultFontFace;
    }

    if (line.FontColor === undefined || line.FontColor.trim() === "") {
      line.FontColor = $.Param.DefaultFontColor;
    }

    line.FontSize = Number(line.FontSize || $.Param.DefaultFontSize);
    line.X = Number(line.X || 0);
    line.Y = Number(line.Y || 0);

    if (line.FontItalic === undefined || line.FontItalic.trim() === "") {
      line.FontItalic = $.Param.DefaultFontItalic;
    } else {
      line.FontItalic = line.FontItalic == "true";
    }

    line.SwitchId = Number(line.SwitchId || 0);
  }

  Window_OrangeHud.prototype.initialize = function() {
    Window_Base.prototype.initialize.call(this, 0, 0, this.windowWidth(), this.windowHeight());
    this.refresh();
  };

  Window_OrangeHud.prototype.windowWidth = function() {
    return $.Param.HudWidth;
  };
  Window_OrangeHud.prototype.windowHeight = function() {
    return $.Param.HudHeight;
  };

  Window_OrangeHud.prototype.drawVariable = function(variableData) {
    if (variableData.SwitchId > 0) {
      if (!$gameSwitches.value(variableData.SwitchId)) {
        return;
      }
    }

    var pattern = variableData.Pattern;
    if (variableData.ScriptPattern !== undefined) {
      pattern = Function("return " + variableData.ScriptPattern)();
    }

    var line = pattern.format($gameVariables.value(variableData.VariableId));

    this.contents.fontFace = variableData.FontFace;
    this.contents.fontSize = variableData.FontSize;
    this.contents.fontItalic = variableData.FontItalic;
    this.changeTextColor(variableData.FontColor);

    this.drawTextEx(line, variableData.X, variableData.Y);

    this.resetFontSettings();
  };

  Window_OrangeHud.prototype.drawTextEx = function(text, x, y) {
    if (text) {
      var textState = {
        index: 0,
        x: x,
        y: y,
        left: x
      };
      textState.text = this.convertEscapeCharacters(text);
      textState.height = this.calcTextHeight(textState, false);
      // this.resetFontSettings();
      while (textState.index < textState.text.length) {
        this.processCharacter(textState);
      }
      return textState.x - x;
    } else {
      return 0;
    }
  };

  Window_OrangeHud.prototype.refresh = function() {
    if (this.contents) {
      this.contents.clear();
      this.drawHud();
    }
  };

  Window_OrangeHud.prototype.drawHud = function() {
    // var y = 0;
    var self = this;
    this._lines = {};

    $.Param.LineList.forEach(function(variable) {
      self.drawVariable(variable);
      self._lines[variable.VariableId] = $gameVariables.value(variable.VariableId);
    });
  };

  Window_OrangeHud.prototype.update = function() {
    Window_Base.prototype.update.call(this);

    var shouldRefresh = false;
    var self = this;
    $.Param.LineList.forEach(function(variable) {
      if ($gameVariables.value(variable.VariableId) != self._lines[variable.VariableId]) {
        shouldRefresh = true;
      }
    });

    if (shouldRefresh) {
      this.refresh();
    }
  };

  var oldSceneMap_start = Scene_Map.prototype.start;
  Scene_Map.prototype.start = function() {
    oldSceneMap_start.call(this);

    this.createVarHudWindow();

    if ($.Param.SwitchId !== undefined && $.Param.SwitchId > 0) {
      this._varHudWindow.visible = $gameSwitches.value($.Param.SwitchId);
    }
  };

  Scene_Map.prototype.createVarHudWindow = function() {
    this._varHudWindow = new Window_OrangeHud();
    this._varHudWindow.x = $.Param.HudX;
    this._varHudWindow.y = $.Param.HudY;
    this._varHudWindow.opacity = $.Param.HudOpacity;

    this.addChild(this._varHudWindow);
  };

  var oldSceneMap_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function() {
    oldSceneMap_update.call(this);

    if ($.Param.SwitchId !== undefined && $.Param.SwitchId > 0) {
      this._varHudWindow.visible = $gameSwitches.value($.Param.SwitchId);
    }

    this._varHudWindow.update();
  };
})(OrangeHud);

PluginManager.register("OrangeHud", "1.1.0", "Displays a custom HUD on the map", {
  email: "plugins@hudell.com",
  name: "HUDell",
  website: "http://www.hudell.com"
}, "2015-10-24");
