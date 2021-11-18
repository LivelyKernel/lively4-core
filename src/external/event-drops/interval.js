import uniqBy from 'src/external/lodash/lodash.js';

export default (config, xScale) => selection => {
    const {
        interval: {
            color,
            width,
            id,
            startDate,
            endDate,
            onClick,
            onMouseOver,
            onMouseOut,
        },
    } = config;

    const intervals = selection
        .selectAll('.interval')
        .data(d => d.intervalData);
    //Todo: filter overlapping?
  
    intervals
        .enter()
        .append('line')
        .classed('interval', true)
        .on('click', onClick)
        .on('mouseover', onMouseOver)
        .on('mouseout', onMouseOut)
        .merge(intervals)
        .attr('id', id)
        .attr('x1', d => Math.max(0, xScale(startDate(d))))
        .attr('x2', d => xScale(endDate(d)))
        .attr('stroke', color)
        .attr('stroke-width', width);

    intervals
        .exit()
        .on('click', null)
        .on('mouseover', null)
        .on('mouseout', null)
        .remove();
};
