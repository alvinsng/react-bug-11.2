var React = require('react');
var Layout = require('./components/Layout');

module.exports = {
  run: function(whereDOM) {
    React.renderComponent(
      <Layout />,
      whereDOM
    );
  },
};
