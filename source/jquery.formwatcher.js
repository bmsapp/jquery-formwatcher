/* 
FormWatcher jQuery plugin

Author:         Ben Sapp
Created:        March 2012
MIT license:    http://www.opensource.org/licenses/mit-license.php

Source:
 - https://github.com/bmsapp/jquery-formwatcher

Special thanks to:
 - Brian Grinstead for his bindWithDelay plugin: http://www.briangrinstead.com/files/bindWithDelay/
 - This "insin" guy: http://stackoverflow.com/a/155812/128506
*/

if (typeof jQuery === 'undefined') throw ("jQuery could not be found.");
if (typeof $.fn.bindWithDelay === 'undefined') throw ("A required plugin 'bindWithDelay' could not be found.");

(function ($) {

    $.fn.formwatcher = function (options) {

        var settings =
            $.extend(
                this.formwatcher.defaults,
                options
            );

        var methods = {
            init: function () {

                var form = this;

                // setup events
                helpers.bindCustom(form);
                helpers.bindTextual(form);
                helpers.bindSelecting(form);

                $.each(
                    settings.dynamicContainers,
                    function (i) 
                    {
                        if (settings.dynamicContainers[i].containerId) 
                        {
                            var selector = '#' + settings.dynamicContainers[i].containerId;
                            var container = $(selector);
                        
                            if (container.length) {
                                container.data('initialState.formwatcher', container[0].innerHTML);
                            }
                        
                            if (settings.dynamicContainers[i].elementAddedEventName) {
                                $(form).bind(
                                    settings.dynamicContainers[i].elementAddedEventName + "." + settings.dynamicContainers[i].containerId, 
                                    function (event) {
                                    
                                        helpers.checkDynamic($(event.target).closest(selector)[0]);
                                    
                                    }
                                );
                            }
                        
                            if (settings.dynamicContainers[i].elementRemovedEventName) {
                                $(form).bind(
                                    settings.dynamicContainers[i].elementRemovedEventName + "." + settings.dynamicContainers[i].containerId, 
                                    function (event) {
                                    
                                        var dynamicContainer = $(event.target).closest(selector);
                                    
                                        if (dynamicContainer.length) {
                                            helpers.checkDynamic(dynamicContainer[0]);
                                        } else {
                                            helpers.checkDynamic($(event.target).parent()[0]);
                                        }

                                    }
                                );
                            }
                        }   
                    }
                );

                // prepare the allDynamicSelectors setting
                var selectors = new Array();

                $.each(
                    settings.dynamicContainers,
                    function (i) {
                        if (settings.dynamicContainers[i].containerId) {
                            selectors[i] = '#' + settings.dynamicContainers[i].containerId;
                        }
                    }
                );

                settings = $.extend(
                    settings,
                    {
                        'allDynamicSelectors': selectors.join(',')
                    }
                );

            },
            checkAll: function () {

                return helpers.checkAllFields(this);

            },
            checkOne: function (element)
            {
                return helpers.checkOneField(element);
            }
        };

        var helpers =
            {
                checkOneField: function (element) {

                    // TODO: Handle HTML 5 input types someday
                    
                    if ($(element).not(settings.ignoreFieldsSelector).length == 0) {
                        return false;
                    }

                    var type = element.type;
                    var isDirty = false;

                    if (type == "checkbox" || type == "radio") {
                        if (element.checked != element.defaultChecked) {
                            isDirty = true;
                        }
                    }
                    else if (type == "text" || type == "textarea") {
                        if (element.value != element.defaultValue) {
                            isDirty = true;
                        }
                    }
                    else if (settings.watchHiddenFields && type == "hidden") {
                        if (element.value != element.defaultValue) {
                            isDirty = true;
                        }
                    }
                    else if (type == "select-one" || type == "select-multiple") {
                        
                        var defaultsExist = false;

                        for (var j = 0; j < element.options.length; j++) {

                            if (element.options[j].selected != element.options[j].defaultSelected) {
                                isDirty = true;
                            }

                            if (element.options[j].defaultSelected) {
                                defaultsExist = true;
                            }
                        }
                        
                        if (!defaultsExist && element.options[0].selected) {
                            isDirty = false;
                        }
                    }

                    var eventSourceElement;

                    // figure out which element should trigger the event.
                    // if the element was dynamically added to the dom then the event should be triggered on that
                    if (settings.allDynamicSelectors)
                    {
                        var dynamicContainer = $(element).closest(settings.allDynamicSelectors);

                        if (dynamicContainer.length) {
                            eventSourceElement = dynamicContainer[0];
                            
                            if (!isDirty) {
                                return helpers.checkDynamic(dynamicContainer[0]);
                            }

                        } else {
                            eventSourceElement = element;
                        }
                    } else {
                        eventSourceElement = element;
                    }
                    
                    helpers.triggerDirtyOrCleanEvent(isDirty, eventSourceElement);

                    return isDirty;
                },
                
                checkDynamic: function(containerElement) {

                    var isDirty = true;
                    var initialData = $(containerElement).data('initialState.formwatcher');
                    
                    if (!initialData) {
                        // an element was added or removed but we aren't tracking the original state of it's container - assume dirty
                        
                        helpers.triggerDirtyOrCleanEvent(true, containerElement);
                        return true;
                    }
                    
                    if ($.browser.msie && $.browser.version.slice(0,1) == "8") {
                        
                        /*   
                        NOTE:
                        In IE8 for some reason the innerHTML is infested with
                        jquery attributes like _change_added=\"true\" after 
                        the events are set up so we have to strip those out
                        both the initial data and the current innerHTML may
                        or may not have these attributes depending on what
                        other js is doing to elements we're watching.
                        */

                        var containerWithoutJqueryEvents = containerElement.innerHTML.replace(/\s_.*"/i, '');;
                        
                        if (initialData === containerWithoutJqueryEvents) {
                            isDirty = false;
                        };
                    } else {
                        
                        if (initialData === containerElement.innerHTML) {
                            isDirty = false;
                        };
                        
                    }

                    helpers.triggerDirtyOrCleanEvent(isDirty, containerElement);

                    return isDirty;
                },
                
                triggerDirtyOrCleanEvent: function(isDirty, element)
                {
                    if (isDirty) {
                        $(element).closest('form').trigger('dirty.formwatcher', [element]);
                    } else {
                        $(element).closest('form').trigger('clean.formwatcher', [element]);
                    }
                },

                checkAllFields: function (form) {

                    var isDirty = false;

                    for (var i = 0; i < form.elements.length; i++) {
                        if (helpers.checkOneField(form.elements[i])) {
                            isDirty = true;
                        }
                    }
                    
                    return isDirty;
                },
                
                bindCustom: function (form) 
                {
                    if (settings.dirtyEventHandler) {
                        $(form).bind('dirty.formwatcher', settings.dirtyEventHandler);
                    }

                    if (settings.cleanEventHandler) {
                        $(form).bind('clean.formwatcher', settings.cleanEventHandler);
                    }
                },
                
                bindTextual: function (form) {
                    if (settings.textualChangeEvents && typeof settings.textualChangeEvents === 'string')
                    {
                        $(form).on(
                            settings.textualChangeEvents.split(' ').join('.formwatcher '),
                            'input[type=text], textarea',
                            function () {
                                helpers.checkOneField(this);
                            }
                        );
                    }

                    if (settings.useKeyUpEvents && settings.keyUpOptions) 
                    {
                        $(form).bindWithDelay(
                            'keyup', 
                            function (event) {
                                helpers.checkOneField(event.srcElement);
                            }, 
                            settings.keyUpOptions.delay
                        );
                    }
                },

                bindSelecting : function (form) {
                    if (settings.selectingChangeEvents && typeof settings.selectingChangeEvents === 'string')
                    {
                        $(form).on(
                            settings.selectingChangeEvents.split(' ').join('.formwatcher '),
                            'select, input[type=checkbox], input[type=radio], input[type=hidden]',
                            function (event) {
                                helpers.checkOneField(event.target);
                            }
                        );

                        return;
                    }
                    
                    $.error('The selectingChangeEvents setting has to be a space-delimited string of events.');
                }
            };

        return this.each(function () {

            // Tooltip plugin code here

            // Method calling logic
            if (methods[options]) {
                return methods[options].apply(this, Array.prototype.slice.call(arguments, 1));
            }
            else if (typeof options === 'object' || !options) {
                return methods.init.apply(this, arguments);
            }
            else {
                $.error('Method ' + options + ' does not exist on jQuery.tooltip');
            }

        });

    };

    $.fn.formwatcher.defaults = {
        'watchHiddenFields': false,
        'useKeyUpEvents': true,
        'textualChangeEvents': 'blur',
        'keyUpOptions': { 'elementSelectors': 'input[type=text], textarea', 'delay': 250 },
        'selectingChangeEvents': 'change blur',
        'dynamicContainers': [{ 'containerId': null, 'elementAddedEventName': null, 'elementRemovedEventName': null }],
        'dirtyEventHandler': null,
        'cleanEventHandler': null,
        'ignoreFieldsSelector': '.formwatcher-ignore'
    };
    
})(jQuery);
