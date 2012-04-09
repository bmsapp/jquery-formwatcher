###jQuery formwatcher plugin
This little guy's job is to provide a reliable event system for tracking changes to html forms.  You just hand it your dirty and clean event handlers and it will call them when each field becomes either dirty or clean.  

The cleanliness of each field is based on the ```defaultValue``` (or equivalent) that was assigned when the page was loaded.  If the value is different from when the form was initially loaded then formwatcher calls it dirty.

formwatcher makes a good-faith effort to raise the dirty/clean events close to the time when they actually change.  For text fields this will be a few hundress milliseconds after keys were pressed.  It also has basic support for watching dynamically added or removed fields from the form (more options are required than below to do this).

####Basic Usage
```javascript
$('form').formwatcher(
    {
        'dirtyEventHandler': function (event, sourceElement) {
            // that sourceElement is filthy!
            // handle that 
        },
        'cleanEventHandler': function (event, sourceElement) {
            // the value was defaulted
            // handle that too
        }
    }
);
```

####Notes
Due to the humble beginnings of this plugin, it doesn't support the fancy new html5 input fields.  Support for those will hopefully come soon.

####License
jQuery-formwatcher uses the [MIT License](http://www.opensource.org/licenses/mit-license.php).

####Special Thanks
 - Brian Grinstead for his bindWithDelay plugin: http://www.briangrinstead.com/files/bindWithDelay/
 - This "insin" guy: http://stackoverflow.com/a/155812/128506
