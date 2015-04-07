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
            success: function(results) {
                console.log('results',results);
            },
            failure:function(error){
                console.log(error);
            }
        }); 
    },
    _onStoriesLoaded:function(stories){
        var promises = [];
        var that = this;
        var storyObj = {};
        return Rally.data.ModelFactory.getModel({
            type: 'Iteration'
        }).then({
            success: function(model) {
                return Deft.Promise.all(_.map(stories, function(story) {
                    var ref = story.get('Iteration')._ref;
                    var oid = Rally.util.Ref.getOidFromRef(ref);
                    return model.load(oid, {
                        fetch: ['Name','StartDate','EndDate']
                    }).then({
                        success: function(iteration) {
                            return {
                                "FormattedID"   : story.get('FormattedID'),
                                "Name"          : story.get('Name'),
                                "Project"       : story.get('Project')._refObjectName,
                                "IterationName" : iteration.get('Name'),
                                "StartDate"     : iteration.get('StartDate'),
                                "EndDate"       : iteration.get('EndDate')
                            };
                        },
                        scope: this
                    });
                }));
            },
            scope: this
        });   
    }
});