// ==UserScript==
// @name           WoL Gnome
// @namespace      maiku@maikumori.com:wol-gnome
// @description    Tiny gnome who adds new features and improvements to World of Logs website.
// @include        http://www.worldoflogs.com/*
// @include        http://worldoflogs.com/*
// @require        http://cdnjs.cloudflare.com/ajax/libs/sizzle/1.4.4/sizzle.min.js
// ==/UserScript==

// ==Globals== 
$ = Sizzle;

pageHandlers = [];

specs = {
    "Frost" : "dps",
    "Unholy" : "dps",
    "Balance"  : "dps",
    "Feral/Cat" : "dps",
    "Beast Mastery" : "dps",
    "Marksmanship" : "dps",
    "Survival" : "dps",
    "Arcane" : "dps",
    "Fire" : "dps",
    "Retribution" : "dps",
    "Shadow" : "dps",
    "Assassination" : "dps",
    "Combat" : "dps",
    "Subtlety" : "dps",
    "Elemental" : "dps",
    "Enhancement" : "dps",
    "Affliction" : "dps",
    "Demonology" : "dps",
    "Destruction" : "dps",
    "Arms" : "dps",
    "Fury" : "dps",
    
    "Restoration" : "healer",
    "Holy" : "healer",
    "Discipline" : "healer",
    
    "Blood" : "tank",
    "Protection" : "tank",
    "Feral/Bear" : "tank"
};

// ==Handlers==
function rankInfo() {
    var raiders = {
        "dps" : [],
        "healer" : [],
        "tank" : []
    };
    var total_bosses = $(".playerdata").length;
    var rows = $(".playerdata tr:not(:first-child)");
        
    for (var i = 0, len = rows.length; i < len; i++) {
        var row = rows[i];
        
        var nick = $(".actor span", row)[0].innerHTML;
        var effectiveness = parseFloat($(":nth-child(10)", row)[0].innerHTML.slice(0, -1));
        var spec_type = specs[$(":nth-child(2)", row)[0].innerHTML.split(" ")[0]];
        
        if (raiders[spec_type][nick] !== undefined) {
            raiders[spec_type][raiders[spec_type][nick]].data.push(effectiveness);
            raiders[spec_type][raiders[spec_type][nick]].sum += effectiveness;    
        } else {  
            raiders[spec_type].push({
                "nick" : nick,
                "sum" : effectiveness,
                "data" : [effectiveness]
            });
            raiders[spec_type][nick] = raiders[spec_type].length - 1;
        }
    }
       
    var ef_container = document.createElement('div');
    var ef_row_tpl = template('<tr bgColor="{{ color }}"><td class="n">{{ nick }}</td><td>{{ effectiveness }}%</td><td class="n"> {{boss_count}}</td></tr>');
    var ef_table;
    
    ef_container.style.overflow = "auto";
    ef_container.style.width = "100%";

    for (spec_type in raiders) {
        raiders[spec_type].sort(function(a, b){
            return (b.sum / b.data.length) - (a.sum / a.data.length);
        });
        
        ef_table = document.createElement('table');
        ef_table.className = "debug playerdata";
        ef_table.style.cssFloat = "left";
        
        ef_table.innerHTML += "<tr><th colspan=3>" + spec_type.charAt(0).toUpperCase()
                            + spec_type.slice(1) + (spec_type == "dps" ? "": "s") + "</td></tr>";
        ef_table.innerHTML += "</tr><tr><th>Player</th><th>Avg Effectiveness</th><th>Fights participated</th></tr>";
        
        for (var i = 0, len = raiders[spec_type].length; i < len; i++) {
            ef_table.innerHTML += ef_row_tpl({
                nick : raiders[spec_type][i].nick,
                effectiveness : (raiders[spec_type][i].sum / raiders[spec_type][i].data.length).toFixed(2),
                boss_count: raiders[spec_type][i].data.length,
                color: (raiders[spec_type][i].data.length != total_bosses) ? "#292929" : ""
            });
        }
        
        ef_container.appendChild(ef_table);    
    }
    var h = $("h1")[0];
    h.parentNode.insertBefore(ef_container, h.nextSibling);    
}
registerPageHandler(/^\/reports\/[-a-z0-9]*\/rankinfo\/.*$/i,  rankInfo);

// ==Main function==
(function () {
    //Dispatch
    for(var i = 0; i < pageHandlers.length; i++ ) {	
    if( pageHandlers[i].urlRegEx === null || pageHandlers[i].urlRegEx.test(document.location.pathname) ) { pageHandlers[i].handler(); }
    }
}) ();

// ==Helper functions==
function template(str, data) {
    var c  = {
        evaluate    : /\{([\s\S]+?)\}/g,
        interpolate : /\{\{(.+?)\}\}/g,
        escape      : /<%-([\s\S]+?)%>/g
    };
    var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
      'with(obj||{}){__p.push(\'' +
      str.replace(/\\/g, '\\\\')
         .replace(/'/g, "\\'")
         .replace(c.escape, function(match, code) {
           return "',_.escape(" + code.replace(/\\'/g, "'") + "),'";
         })
         .replace(c.interpolate, function(match, code) {
           return "'," + code.replace(/\\'/g, "'") + ",'";
         })
         .replace(c.evaluate || null, function(match, code) {
           return "');" + code.replace(/\\'/g, "'")
                              .replace(/[\r\n\t]/g, ' ') + "__p.push('";
         })
         .replace(/\r/g, '\\r')
         .replace(/\n/g, '\\n')
         .replace(/\t/g, '\\t')
         + "');}return __p.join('');";
    var func = new Function('obj', tmpl);
    return data ? func(data) : func;
  };

function registerPageHandler(urlRegEx, handler) {
    pageHandlers.push({
        "urlRegEx" : urlRegEx,
        "handler" :handler
    });
}

//java -jar  C:\ClosureCompiler\compiler.jar --js wol-gnome.user.js --js libs\sizzlemin.js --js libs\underscore-min.js --js_output_file out.js