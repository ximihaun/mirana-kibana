import _ from 'lodash';
import dateMath from '@elastic/datemath';
import moment from 'moment';
import 'ui/timepicker/quick_ranges';
import 'ui/timepicker/time_units';
import uiModules from 'ui/modules';
const module = uiModules.get('kibana');


module.directive('prettyDuration', function (config, quickRanges, timeUnits) {
  return {
    restrict: 'E',
    scope: {
      from: '=',
      to: '='
    },
    link: function ($scope, $elem) {
      const dateFormat = config.get('dateFormat');

      const lookupByRange = {};
      _.each(quickRanges, function (frame) {
        lookupByRange[frame.from + ' to ' + frame.to] = frame;
      });

      function stringify() {
        let text;
        // If both parts are date math, try to look up a reasonable string
        if ($scope.from && $scope.to && !moment.isMoment($scope.from) && !moment.isMoment($scope.to)) {
          const tryLookup = lookupByRange[$scope.from.toString() + ' to ' + $scope.to.toString()];
          if (tryLookup) {
            $elem.text(tryLookup.display);
          } else {
            const fromParts = $scope.from.toString().split('-');
            if ($scope.to.toString() === 'now' && fromParts[0] === 'now' && fromParts[1]) {
              const rounded = fromParts[1].split('/');
              //  text = 'Last ' + rounded[0];
              let regex = /^(\d+)([a-zA-Z]+$)/
              if(regex.test(rounded[0])) {
                  let result = rounded[0].match(regex),
                      unitMap = {
                          s : '几秒',
                          m : '分钟',
                          h : '小时',
                          d : '天',
                          dd : '天',
                          M : '月',
                          y : '年',
                          w : '周'
                      },
                      num = parseInt(result[1]),
                      unit = unitMap[result[2]],
                      human = num + unit
                  text = '过去' + human
              } else {
                  text = '过去 ' + rounded[0];
              }
              //  console.log(moment.duration(50, 'y').humanize());
              if (rounded[1]) {
                text = text + ' rounded to the ' + timeUnits[rounded[1]];
              }
              $elem.text(text);
            } else {
              cantLookup();
            }
          }
        // If at least one part is a moment, try to make pretty strings by parsing date math
        } else {
          cantLookup();
        }
      }

      function cantLookup() {
        const display = {};
        _.each(['from', 'to'], function (time) {
          if (moment($scope[time]).isValid()) {
            display[time] = moment($scope[time]).format(dateFormat);
          } else {
            if ($scope[time] === 'now') {
              display[time] = 'now';
            } else {
              const tryParse = dateMath.parse($scope[time], time === 'to' ? true : false);
              display[time] = moment.isMoment(tryParse) ? '~ ' + tryParse.fromNow() : $scope[time];
            }
          }
        });
        $elem.text(display.from + ' 到 ' + display.to);
      }

      $scope.$watch('from', stringify);
      $scope.$watch('to', stringify);

    }
  };
});
