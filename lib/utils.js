import _ from 'underscore';

const utils = {
  join: function join(args) {
    var joined = '';

    _.each(args, function(arg) {

      // has space
      if (arg.indexOf(' ') !== -1) {
        joined += ' "' + arg + '"';
      } else {
        joined += ' ' + arg;
      }

    });

    joined = joined.substr(1);

    return joined;
  }
};

export default utils;
