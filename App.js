Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:{ html:'<a href="https://help.rallydev.com/apps/2.0/doc/">App SDK 2.0 Docs</a>'},
    launch: function() {
        var millisecondsInDay = 86400000;
        var currentDate = new Date();
        var startDate = new Date(currentDate - millisecondsInDay*30); //in the last 90 days
        var startDateUTC = startDate.toISOString();
        
        var stories = Ext.create('Rally.data.wsapi.Store', {
            model: 'UserStory',
            fetch: ['Iteration','FormattedID','Name','Project'],
            filters: [
                {
		property: 'LastUpdateDate',
		operator: '>',
		value: startDateUTC
                },
                {
		property: 'Iteration',
		operator: '!=',
		value: null
                }
            ]
        });
        
        stories.load().then({
            success: this._onStoriesLoaded,
            scope: this
        }).then({
            success: function(results){
                console.log('results',results);
            }
        }); 
    },
    _onStoriesLoaded:function(stories){
        var promises = [];
        var that = this;
        var storyObj = {}
        _.each(stories, function(story) {
            var ref = story.get('Iteration')._ref;
            var oid = Rally.util.Ref.getOidFromRef(ref);
            return Rally.data.ModelFactory.getModel({
                type: 'Iteration',
                success: function (model) {
                    model.load(oid, {
                        fetch: ['StartDate','EndDate'],
                        callback: function (iteration) {
                            storyObj = {
                                "FormattedID"   : story.get('FormattedID'),
                                "Name"          : story.get('Name'),
                                "Project"       : story.get('Project')._refObjectName,
                                "Iteration"     : story.get('Iteration'),
                                "StartDate"     : iteration.get('StartDate'),
                                "EndDate"       : iteration.get('EndDate'),
                            };
                            promises.push(storyObj);
                        },
                    scope: this
                    });
                },
            scope: this
            });
        });
        return Deft.Promise.all(promises);
    }
});