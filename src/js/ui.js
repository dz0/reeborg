/* Author: André Roberge
   License: MIT
 */

/*jshint browser:true, devel:true, indent:4, white:false, plusplus:false */
/*globals $, RUR */

RUR.ui = {};

RUR.ui.stop_called = false;
RUR.ui.new_world_selected = false;

RUR.ui.set_ready_to_run = function () {
    $("#stop").attr("disabled", "true");
    $("#pause").attr("disabled", "true");
    $("#run").removeAttr("disabled");
    $("#step").removeAttr("disabled");
    $("#reverse-step").attr("disabled", "true");
    $("#reload").attr("disabled", "true");
};

RUR.ui.run = function () {
    if (RUR.ui.stop_called){
        RUR.ui.stop_called = false;
        RUR.ui.reload();
    }
    $("#stop").removeAttr("disabled");
    $("#pause").removeAttr("disabled");
    $("#run").attr("disabled", "true");
    $("#step").attr("disabled", "true");
    $("#reverse-step").attr("disabled", "true");
    $("#reload").attr("disabled", "true");

    clearTimeout(RUR.rec.timer);
    RUR.runner.run(RUR.rec.play);
};

RUR.ui.pause = function (ms) {
    RUR.rec.playback = false;
    clearTimeout(RUR.rec.timer);
    $("#pause").attr("disabled", "true");
    if (ms !== undefined){      // pause called via a program instruction
        RUR.rec.timer = setTimeout(RUR.ui.run, ms);  // will reset RUR.rec.playback to true
    } else {
        $("#run").removeAttr("disabled");
        $("#step").removeAttr("disabled");
        $("#reverse-step").removeAttr("disabled");
    }
};

RUR.ui.step = function () {
    RUR.runner.run(RUR.rec.display_frame);
    RUR.ui.stop_called = false;
    $("#stop").removeAttr("disabled");
    $("#reverse-step").removeAttr("disabled");
    clearTimeout(RUR.rec.timer);
};


RUR.ui.reverse_step = function () {
    RUR.rec.current_frame -= 2;
    if (RUR.rec.current_frame < 0){
        $("#reverse-step").attr("disabled", "true");
    }
    RUR.runner.run(RUR.rec.display_frame);
    RUR.ui.stop_called = false;
    $("#stop").removeAttr("disabled");
    clearTimeout(RUR.rec.timer);
};


RUR.ui.stop = function () {
    clearTimeout(RUR.rec.timer);
    $("#stop").attr("disabled", "true");
    $("#pause").attr("disabled", "true");
    $("#run").removeAttr("disabled");
    $("#step").attr("disabled", "true");
    $("#reverse-step").attr("disabled", "true");
    $("#reload").removeAttr("disabled");
    RUR.ui.stop_called = true;
};

RUR.ui.reload = function() {
    RUR.ui.set_ready_to_run();
    $("#highlight-impossible").hide();
    $("#stdout").html("");
    $("#_write").html("");
    $(".view_source").remove();
    $("#narrates").html("");
    $("#Reeborg-concludes").dialog("close");
    $("#Reeborg-shouts").dialog("close");
    // reset the options in case the user has dragged the dialogs as it would
    // then open at the top left of the window
    $("#Reeborg-concludes").dialog("option", {minimize: false, maximize: false, autoOpen:false, width:500, dialogClass: "concludes", position:{my: "center", at: "center", of: $("#robot_canvas")}});
    $("#Reeborg-shouts").dialog("option", {minimize: false, maximize: false, autoOpen:false, width:500, dialogClass: "alert", position:{my: "center", at: "center", of: $("#robot_canvas")}});
    RUR.world.reset();
    RUR.runner.interpreted = false;
    RUR.control.sound_flag = false;
    RUR.rec.reset();
};

RUR.ui.select_world = function (s, silent) {
    var elt = document.getElementById("select_world");
    for (var i=0; i < elt.options.length; i++){
        if (elt.options[i].text === s) {
            if (elt.options[i].selected) {
                return;
            }
            elt.value = elt.options[i].value;
            $("#select_world").change();
            if (silent) {
                return;
            }
            throw new RUR.ReeborgError(RUR.translate("World selected").supplant({world: s}));
        }
    }
    if (silent) {
        return;
    }
    throw new RUR.ReeborgError(RUR.translate("Could not find world").supplant({world: s}));
};

RUR.ui.load_file = function (filename, replace, elt, i) {
    "use strict";
    var url;
    url=filename;
    if (filename.substring(0,11) == "src/worlds/") {
        filename = filename.replace("src/worlds/", '').replace(".json", '');
    }
    $.ajax({url: url,
        async: false,
        error: function(e){
            RUR.ui.load_file_error = true;
        },
        success: function(data){
            RUR.world.import_world(data);
            console.log("in ui.load_file, data = ", data);
            if (replace) {
                elt.options[i].value = url;
                elt.value = elt.options[i].value;
            } else {
                $('#select_world').append( $('<option class="select-local-storage" selected="true"></option>'
                                      ).val(url).html(filename));
                $('#select_world').val(url);
            }
            $("#select_world").change();
        }
    }, "text");
};

RUR.ui.load_user_worlds = function (initial) {
    var key, name, i;
    for (i = localStorage.length - 1; i >= 0; i--) {
        key = localStorage.key(i);
        if (key.slice(0, 11) === "user_world:") {
            name = key.slice(11);
            RUR.storage.append_world_name(name, initial);
            $('#delete-world').show();
        }
    }
};

RUR.ui.highlight = function (arg) {
    if (RUR._highlight) {
        RUR._highlight = false;
        if (arg){
            RUR._automatic_highlight_off = true;
        }
        $("#not-ok-image").show();
        $("#ok-image").hide();
    } else {
        RUR._highlight = true;
        $("#not-ok-image").hide();
        $("#ok-image").show();
    }
};

RUR.ui.buttons = {execute_button: '<img src="src/images/play.png" class="blue-gradient" alt="run"/>',
    reload_button: '<img src="src/images/reload.png" class="blue-gradient" alt="reload"/>',
    step_button: '<img src="src/images/step.png" class="blue-gradient" alt="step"/>',
    pause_button: '<img src="src/images/pause.png" class="blue-gradient" alt="pause"/>',
    stop_button: '<img src="src/images/stop.png" class="blue-gradient" alt="stop"/>'};

RUR.ui.add_help = function(usage, _id, lang, warning){

    if (RUR.ui._added_lang === undefined) {
        RUR.ui._added_lang = [lang];
    } else if (RUR.ui._added_lang.indexOf(lang)== -1) {
        RUR.ui._added_lang.push(lang);
    } else {
        return;
    }
    if (document.documentElement.lang != _id){
        $("#help").prepend('<span style="color:darkred">' + warning + RUR.translate("Object names") + "</span><br>");
    }
    $("#toc").after(usage);
    $("#toc").prepend('<li><a href="#basic-commands-' + _id + '">' + lang + "</a></li>");
};


RUR.ui.toggle_panel = function (button, element) {
    button.toggleClass("blue-gradient");
    button.toggleClass("reverse-blue-gradient");
    element.toggleClass("active");
};