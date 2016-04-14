Ext.define('Rally.example.BurnCalculator', {
	extend: 'Rally.data.lookback.calculator.TimeSeriesCalculator',
	/*	config: {
			completedScheduleStateNames: [ 'Released' ],
			uncommitedScheduleStateNames: [ 'Idea' ]
		}, */
			
		constructor: function(config) {
			this.initConfig(config);
			this.callParent(arguments);
		},
			
		getDerivedFieldsOnInput: function() {
			var completedScheduleStateNames = [ 'Released' ];
			var uncommitedScheduleStateNames = [ 'Idea' ];
			return [
				{
					"as": "Remaining",
					"f": function(snapshot) {
						if (!_.contains(completedScheduleStateNames, snapshot.ScheduleState) && snapshot.PlanEstimate) {
							return snapshot.PlanEstimate;
						}
						return 0;
					}
				},
				{
					"as": "Total Scope",
					"f": function(snapshot) {
						if (!_.contains(uncommitedScheduleStateNames, snapshot.ScheduleState) && snapshot.PlanEstimate) {
							return snapshot.PlanEstimate;
						}
						return 0;
					}
				},
				{
					"as": "Guideline",
					"f": function(snapshot) {
						var new_date = new Date( snapshot.tick[0] );
						var old_date = new Date( '2016-03-28' );
						
						if ( isNaN( new_date ) || isNaN( old_date ) ) {
							return 0;
						}
			
						var workdays = 0;
						var date = old_date;
						while ( date < new_date ) {
							if ( date.getDay() !== 0 && date.getDay() != 6 ) {
								workdays = workdays + 1;
							}
							date.setDate( date.getDate() + 1 );
						}
						return workdays;
					}
				}
			];
		},			
		getMetrics: function() {
			return [
				{
					"field": "Remaining",
					"as": "Remaining",
					"display": "column",
					"f": "sum"
				},
				{
					"field": "Total Scope",
					"as": "Total Scope",
					"display": "line",
					"f": "sum"
				},
				{
					"field": "Guideline",
					"as": "Guideline",
					"display": "line",
					"f": "max"
				}
			];
		}
	});
			
	// Iteration 7 -- var ITERATION_OID = 51834144714; //The ObjectID of the PI on which to burn
	var ITERATION_OID = 47998626614; // Iteration 6 
			
	Ext.define('CustomApp', {
		extend: 'Rally.app.App',
		requires: [
			'Rally.example.BurnCalculator'
		],
			
		launch: function() {
		//	alert ( "Paused" );
			this.add({
				xtype: 'rallychart',
				storeType: 'Rally.data.lookback.SnapshotStore',
				storeConfig: this._getStoreConfig(),
				calculatorType: 'Rally.example.BurnCalculator',
				calculatorConfig: {
					completedScheduleStateNames: ['Released'],
					startDate: new Date( '2016-03-28' ),
					endDate: new Date( '2016-04-08' )
				},
					chartConfig: this._getChartConfig()
				});
			//	var rallychart = this.children[0];
			//	highchart = rallychart.getChart();
			//	alert ( rallychart );
			},
			
			/**
			 * Generate the store config to retrieve all snapshots for all children of the specified Iteration
			 */
			_getStoreConfig: function() {
				return {
					find: {
						Iteration: ITERATION_OID
					},
					
					fetch: ['ScheduleState', 'PlanEstimate'],
					hydrate: ['ScheduleState'],
					sort: {
						_ValidFrom: 1
					},
					context: this.getContext().getDataContext(),
					limit: Infinity
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
		}
	);