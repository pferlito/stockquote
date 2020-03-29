import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts/highstock";
import React from "react";

export function Chart({data}) {

  const options = {
    series: [{
      data: data,
      type: 'candlestick',
      name: `CSCO Stock Price`,
      id: 'csco'
    }],
    title: {
      text: `CSCO Stock Price`
    },
    rangeSelector: {
      buttons: [{
        type: 'hour',
        count: 1,
        text: '1 min',
        dataGrouping: {
          forced: true,
          units: [['minute', [1]]]
        }
      }, {
        type: 'hour',
        count: 2,
        text: '2 min',
        dataGrouping: {
          forced: true,
          units: [['minute', [2]]]
        }
      }, {
        type: 'hour',
        count: 2,
        text: '5 min',
        dataGrouping: {
          forced: true,
          units: [['minute', [5]]]
        }
      }, {
        type: 'all',
        text: 'All'
      }],
      buttonTheme: {
        width: 60
      },
      selected: 3,
      allButtonsEnabled: true,
      inputEnabled: false
    },
    navigator: {
      enabled: false
    },
    chart: {
      animation: false,
      events: {
        load: function () {
        }
      }
    },
    time: {
      timezoneOffset: 7 * 60
    }
  };

  return (
    <HighchartsReact
      highcharts={Highcharts}
      constructorType={'stockChart'}
      options={options}
    />
  )
}
