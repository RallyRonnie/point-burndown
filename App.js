var ITERATION_ID = 0;
var DATA = [];
var DATE_ITR = null;
var START_DATE = null;
var END_DATE = null;
var UNCOMMITTED_SCHEDULE_STATES = [ 'Idea' ];
var COMPLETED_SCHEDULE_STATES = [ 'Released' ];

Ext.define('CustomApp', {
	extend: 'Rally.app.App',
	
	launch: function() {
		record = this.getContext().getTimeboxScope().record.raw;
		ITERATION_ID = record.ObjectID;
		START_DATE = new Date( record.StartDate );
		END_DATE = new Date( record.EndDate );
		DATE_ITR = START_DATE;
		// Increment the date by 1 day as Team's often plan on the first day of the iteration
		DATE_ITR.setDate( DATE_ITR.getDate() + 1 );
		this.loadWorkItemsForDate( DATE_ITR );
	},
	
	loadWorkItemsForDate: function( date ) {
		var snapshotStore = Ext.create( 'Rally.data.lookback.SnapshotStore', {
			fetch: ['PlanEstimate', 'ScheduleState'],
			autoLoad: true,
			listeners: {
				load: this.onWorkItemsLoaded,
				scope: this
			},
			context: this.getContext().getDataContext(),
			limit: Infinity,
			hydrate: ['ScheduleState'],
			find: {
				Iteration: ITERATION_ID,
				__At: date.toISOString()
			}
		});
	},
	
	onWorkItemsLoaded: function( store, records ) {
		// If we already have data for this date, skip it
		for ( var i = 0; i < DATA.length; i ++ ) {
			if ( DATA[i].date == DATE_ITR ) {
				return false;
			}
		}
		
		var date_data = {};
		date_data.date = new Date( DATE_ITR.valueOf() );
		
		var total_scope = 0;
		var completed_scope = 0;
					
		for ( var j = 0; j < records.length; j ++ ) {
			var record_data = records[j].data;
			
			if ( !_.contains( UNCOMMITTED_SCHEDULE_STATES, record_data.ScheduleState ) ) {
				total_scope = total_scope + record_data.PlanEstimate;
				if ( _.contains( COMPLETED_SCHEDULE_STATES, record_data.ScheduleState ) ) {
					completed_scope = completed_scope + record_data.PlanEstimate;
				}
			}
		}
		
		date_data.total_scope = total_scope;
		date_data.completed_scope = completed_scope;
		DATA.push( date_data );
		
		// Load the next date if we're not done
		if ( DATE_ITR <= END_DATE ) {
			DATE_ITR.setDate( DATE_ITR.getDate() + 1 );
			this.loadWorkItemsForDate( DATE_ITR );
		} else {
			this.createHighChartData();
		}
	},
	
	createHighChartData: function() {
		this.add({
            xtype: 'rallychart',
            loadMask: false,
            chartData: this._getChartData(),
            chartConfig: this._getChartConfig()
        });
	},
	
	/**
     * Generate x axis categories and y axis series data for the chart
     */
    _getChartData: function() {
        
        var dates = [];
        var totals = [];
        var remainings = [];
        var ideals = [];
        var initial_scope = DATA[0].total_scope;
        var ideal_velocity = initial_scope / ( DATA.length - 1 );
        for ( var i = 0; i < DATA.length; i++ ) {
			// set the label to the day before to show where the data was at the end of the day
			var date = new Date( DATA[i].date.valueOf() );
			date.setDate( date.getDate() - 1 );
        
			dates.push( date.toDateString() );
			totals.push( DATA[i].total_scope );
			remainings.push( DATA[i].total_scope - DATA[i].completed_scope );
			ideals.push( initial_scope - ( i * ideal_velocity ) );
        }
        
        return {
            categories: dates,
            series: [
                {
                    name: 'Remaining Scope',
                    data: remainings,
                    type: 'column'
				},
				{
                    name: 'Total Scope',
                    data: totals,
                    type: 'line'
				},
				{
                    name: 'Ideal Burndown',
                    data: ideals,
                    type: 'line'
				}
			]
        };
    },
	
	/**
	 * Generate a valid Highcharts configuration object to specify the chart
	 */
	_getChartConfig: function() {
		return {
				chart: {
					defaultSeriesType: 'area',
					zoomType: 'xy'
				},
				title: {
					text: 'Iteration Burndown'
				},
				xAxis: {
					tickmarkPlacement: 'on',
					tickInterval: 1,
					title: {
						text: 'Date',
						margin: 10
					}
				},
				yAxis: [
					{
						title: {
							text: 'Points'
						}
					}
				],
				tooltip: {
					formatter: function() {
						return '' + this.x + '<br />' + this.series.name + ': ' + this.y;
					}
				},
				plotOptions: {
					series: {
						marker: {
							enabled: false,
							states: {
								hover: {
									enabled: true
								}
							}
						},
						groupPadding: 0.01
					},
					column: {
						stacking: null,
						shadow: false
					}
				}
		};
	}
});