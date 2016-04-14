var ITERATION_ID = 0;
var DATA = [];
var DATE_ITR = null;
var START_DATE = null;
var END_DATE = null;

Ext.define('CustomApp', {
	extend: 'Rally.app.App',
	
	launch: function() {
		alert ( "Paused" );
		
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
		
			alert( "Iteration Model Loaded" );
			ITERATION_ID = record.get( 'ObjectID' );
			START_DATE = record.get( 'StartDate' );
			END_DATE = record.get( 'EndDate' );
			DATE_ITR = START_DATE;
			
			var snapshotStore = Ext.create( 'Rally.data.lookback.SnapshotStore', {
				fetch: ['PlanEstimate', 'ScheduleState'],
				autoLoad: true,
				listeners: {
					load: this.onWorkItemsLoaded
				},
				context: this.getContext().getDataContext(),
				limit: Infinity,
				hydrate: ['ScheduleState'],
				find: {
					Iteration: ITERATION_ID,
					__AT: DATE_ITR
				}
			});
			snapshotStore.load();
		}
	},
	
	onWorkItemsLoaded: function( store, records ) {
		alert( "Work Items Loaded!" );
		alert( records.length );
	}
		
	/*	requires: [
			'Rally.example.BurnCalculator'
		],
			
		launch: function() {
			alert ( "Paused" );
			this.addChart();//.then({
			//	success: this.addIdealBurndown,
		//		scope: this
			//});
		},
		
		addChart: function() {
			//create a deferred
 		var deferred = Ext.create('Deft.Deferred');

 		//perform an async operation
 		var chart = this.add({
				xtype: 'rallychart',
				storeType: 'Rally.data.lookback.SnapshotStore',
				storeConfig: this._getStoreConfig(),
				calculatorType: 'Rally.example.BurnCalculator',
				calculatorConfig: {
					startDate: new Date( '2016-03-28' ),
					endDate: new Date( '2016-04-08' )
				},
				chartConfig: this._getChartConfig(),
				listeners: {
					click: {
						fn: this.addIdealBurndown()
					}
				}
			});
			
			deferred.resolve(chart);
    		
    		//return the promise
			return deferred.promise;
		}, */
		
		/**
		 * Add the Ideal Burndow
		 */
	//	addIdealBurndown: function(chart) {
	//		var highchart = Ext.ComponentQuery.query( 'rallychart' )[0];
	//		highchart = highchart.highchart;
	//		highchart.colors = [ '#FF0000', '#00FF00', '#0000FF' ];
	//	},

		/**
		 * Generate a valid Highcharts configuration object to specify the chart
		 */
	/*	_getChartConfig: function() {
			return {
					chart: {
						defaultSeriesType: 'area',
						zoomType: 'xy'
					},
					title: {
						text: 'Iteration Burndown'
					},
					xAxis: {
						categories: [],
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
	*/
	//}
});