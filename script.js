'use strict';

const _ = require('lodash');
const Script = require('smooch-bot').Script;

const scriptRules = require('./script.json');

module.exports = new Script({
    processing: {
        //prompt: (bot) => bot.say('Beep boop...'),
        receive: () => 'processing'
    },

    start: {
        receive: (bot) => {
            return bot.say("Hi Shaun, you will have recently received your first payslip. I thought I would check in to see if you have any questions relating to it?")
                .then(() => 'speak');
        }
    },

    speak: {
        receive: (bot, message) => {

            let upperText = message.text.trim().toUpperCase();
            let numbers = _.words(upperText, /[\d^, ]+/g);

            function getContext() {
                var context = bot.getProp("context");
                return context;
            }

            function setContext(context) {
                return bot.setProp("context", context);
            }

            function processMessage(context) {

                if(context === undefined) {
                    context = "idle";
                }

                if (upperText === "") {
                    return bot.say("I didn't catch that.").then(() => 'speak');
                }

                var rules = scriptRules[context];
                var match = _.find(rules, function(line) {
                    var found;
                    if(line.keywords[0] === "*") {
                        return true;
                    }
                    found = _.find(line.keywords, function(keyword) {
                        var token = keyword.substring(0, 2);
                        if( token === "%d") {
                            return (numbers.length > 0);
                        } else {
                            var searchIndex = upperText.search(keyword);
                            return (searchIndex >= 0);
                        }


                    });
                    return found;
                });

                if (match === undefined) {
                    return bot.say("I didn't understand that.").then(() => 'speak');
                }

                var p = Promise.resolve();
                p = p.then(function() {
                    setContext(match.target_context);

                    _.forEach(match.responses, function(response, key) {
                        var responseText = _.replace(response, /%d/, numbers[0]);
                        return bot.say(responseText);
                    });
                });

                /*
                _.each(lines, function(line) {
                    line = line.trim();
                    if (!line.startsWith("<")) {
                        p = p.then(function() {
                            return bot.say(line);
                        });
                    } else {
                        p = p.then(function() {
                            var start = line.indexOf("'") + 1;
                            var end = line.lastIndexOf("'");
                            var imageFile = line.substring(start, end);
                            return bot.sendImage(imageFile);
                        });
                    }
                })

                */
                return p.then(() => 'speak');

            }

            return getContext()
                    .then(processMessage)
        }
    }
});
