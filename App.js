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
		var types = Rally.data.ModelFactory.types;
			
		Rally.data.ModelFactory.getModel({
			type: 'iteration',
			context: this.getContext().getDataContext(),
			success: this.onIterationModelLoaded,
			scope: this
		});
	},
	
	onIterationModelLoaded: function( model ) {
		var iteration_id = 47998626614;
	
		model.load( iteration_id, {
			fetch: [ 'ObjectID', 'StartDate', 'EndDate' ],
			callback: this.onIterationLoaded,
			scope: this
		});
	},
	
	onIterationLoaded: function( record, operation ) {
		if( operation.wasSuccessful() ) {
		
			console.log( "Iteration Model Loaded" );
			ITERATION_ID = record.get( 'ObjectID' );
			START_DATE = new Date( record.get( 'StartDate' ) );
			END_DATE = new Date( record.get( 'EndDate' ) );
			DATE_ITR = START_DATE;
			
			console.log( "Iteration ID: " + ITERATION_ID );
			console.log( "Start Date: " + new Date( DATE_ITR ).toISOString() );
			
			this.loadWorkItemsForDate( DATE_ITR );
		}
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
		console.log( "Work Items Loaded: " + records.length );
		
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
			
			console.log ( record_data.ScheduleState + " - " + record_data.PlanEstimate );
			
			if ( !_.contains( UNCOMMITTED_SCHEDULE_STATES, record_data.ScheduleState ) ) {
				total_scope = total_scope + record_data.PlanEstimate;
				if ( _.contains( COMPLETED_SCHEDULE_STATES, record_data.ScheduleState ) ) {
					completed_scope = completed_scope + record_data.PlanEstimate;
				}
			}
		}
		
		date_data.total_scope = total_scope;
		date_data.completed_scope = completed_scope;
		console.log( "Total = " + total_scope + " & Completed = " + completed_scope );
		DATA.push( date_data );
		
		// Load the next date if we're not done
		if ( DATE_ITR <= END_DATE ) {
			DATE_ITR.setDate( DATE_ITR.getDate() + 1 );
			console.log("New Date - " + DATE_ITR );
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
        for ( var i = 0; i < DATA.length; i++ ) {
			dates.push( DATA[i].date.toDateString() );
			totals.push( DATA[i].total_scope );
			remainings.push( DATA[i].total_scope - DATA[i].completed_scope );
        }
        
        return {
            categories: dates,
            series: [
                {
                    name: 'Total Scope',
                    data: totals,
                    type: 'line'
				},
                {
                    name: 'Remaining Scope',
                    data: remainings,
                    type: 'column'
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