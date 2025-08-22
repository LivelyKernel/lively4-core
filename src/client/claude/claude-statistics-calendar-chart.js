import d3 from "src/external/d3.v5.js";
import moment from "src/external/moment.js";

import ClaudeSessions from 'src/client/claude-sessions.js';

const humanReadable = ClaudeSessions.formatNumber
const inDollar = ClaudeSessions.formatDollarAmount


export default class ClaudeStatisticsCalendarChart {
    
  static create(container, calendarData) {
    // Get date range from data
    const dates = Object.keys(calendarData).sort();
    if (dates.length === 0) return;
    
    const startDate = moment(dates[0]);
    const endDate = moment(dates[dates.length - 1]);
    
    // Calculate dimensions - 200x200px per day
    const daySize = 200;
    const margin = { top: 60, right: 40, bottom: 40, left: 100 };
    
    // Get start of week for first date and end of week for last date
    const calendarStart = startDate.clone().startOf('week');
    const calendarEnd = endDate.clone().endOf('week');
    
    // Calculate number of weeks
    const weeks = Math.ceil(calendarEnd.diff(calendarStart, 'days') / 7);
    
    const width = 7 * daySize + margin.left + margin.right;
    const height = weeks * daySize + margin.top + margin.bottom;
    
    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('class', 'calendar-svg')
      .attr('width', width)
      .attr('height', height);
    
    // Calculate max values for color scaling
    let maxMessages = 0;
    let maxTokens = 0;
    let maxCost = 0;
    
    Object.values(calendarData).forEach(dayData => {
      Object.values(dayData).forEach(hourData => {
        maxMessages = Math.max(maxMessages, hourData.messages);
        maxTokens = Math.max(maxTokens, hourData.tokens);
        maxCost = Math.max(maxCost, hourData.cost);
      });
    });
    
    // Color scale based on COST per 15-minute slot, capped at $3.00
    const maxCostPer15Min = 3.00; // $3 per 15-minute slot maximum
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, maxCostPer15Min]);
    
    // Create main chart group
    const chart = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Day labels (top)
    const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    chart.selectAll('.day-label')
      .data(dayLabels)
      .enter()
      .append('text')
      .attr('class', 'calendar-day-label')
      .attr('x', (d, i) => i * daySize + daySize / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .text(d => d);
    
    // Working hours for 3x4 grid layout: 8-11, 12-15, 16-19
    const workingHours = Array.from({length: 12}, (_, i) => i + 8); // 8-19
    // Hour labels are now shown within each hour cell, no separate axis needed
    
    // Generate calendar grid
    const currentDate = calendarStart.clone();
    for (let week = 0; week < weeks; week++) {
      for (let day = 0; day < 7; day++) {
        const dateString = currentDate.format('YYYY-MM-DD');
        const dayOfWeek = currentDate.day();
        
        // Day background container
        chart.append('rect')
          .attr('class', 'calendar-day-cell')
          .attr('x', dayOfWeek * daySize)
          .attr('y', week * daySize)
          .attr('width', daySize)
          .attr('height', daySize)
          .attr('fill', '#f9f9f9')
          .attr('stroke', '#333')
          .attr('stroke-width', 2);
        
        // Day date label
        chart.append('text')
          .attr('class', 'calendar-axis-text')
          .attr('x', dayOfWeek * daySize + daySize / 2)
          .attr('y', week * daySize + 20)
          .attr('text-anchor', 'middle')
          .attr('font-size', '16px')
          .attr('font-weight', 'bold')
          .text(currentDate.format('MMM D'));
        
        // Render 3x4 hour grid with horizontal 15-minute slots
        // Grid layout: 3 rows × 4 columns = 12 hours (8-19)
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 4; col++) {
            const hourIndex = row * 4 + col;
            const hour = workingHours[hourIndex];
            const hourString = hour.toString().padStart(2, '0');
            
            // Position within the 200x200px day cell
            const cellWidth = 47; // ~200px / 4 cols = 50px, minus margins
            const cellHeight = 50; // ~200px / 4 rows = 50px (leaving space for date)
            const x = dayOfWeek * daySize + 5 + col * 48;
            const y = week * daySize + 30 + row * 52;
            
            // Hour background
            chart.append('rect')
              .attr('class', 'calendar-hour-container')
              .attr('x', x)
              .attr('y', y)
              .attr('width', cellWidth)
              .attr('height', cellHeight)
              .attr('fill', '#f9f9f9')
              .attr('stroke', '#ddd')
              .attr('stroke-width', 1);
            
            // Hour label
            chart.append('text')
              .attr('class', 'calendar-hour-label')
              .attr('x', x + cellWidth / 2)
              .attr('y', y + 12)
              .attr('text-anchor', 'middle')
              .attr('font-size', '11px')
              .attr('font-weight', 'bold')
              .text(`${hour}:00`);
            
            // 4 HORIZONTAL 15-minute slots within this hour (side by side)
            for (let slot = 0; slot < 4; slot++) {
              const minutes = slot * 15;
              const slotX = x + 2 + slot * 10.5; // Side by side horizontally
              const slotY = y + 16; // Below hour label
              const slotWidth = 10; // Each 15-min slot width
              const slotHeight = 30; // Height of the activity bar
              
              // Get 15-minute data (we'll need to aggregate by 15-min intervals)
              const hourData = calendarData[dateString] && calendarData[dateString][hourString];
              
              if (hourData && hourData.slots && hourData.slots[slot] && hourData.slots[slot].messages > 0) {
                // Use actual 15-minute slot data
                const slotData = hourData.slots[slot];
                const slotMessages = slotData.messages;
                const slotCost = slotData.cost;
                
                // Cap the cost at $3 for color scaling
                const cappedCost = Math.min(slotCost, maxCostPer15Min);
                const color = colorScale(cappedCost);
                const intensity = cappedCost / maxCostPer15Min;
                
                chart.append('rect')
                  .attr('class', 'calendar-15min-slot')
                  .attr('x', slotX)
                  .attr('y', slotY)
                  .attr('width', slotWidth)
                  .attr('height', slotHeight)
                  .attr('fill', color)
                  .attr('stroke', intensity > 0.5 ? '#fff' : '#e0e0e0')
                  .attr('stroke-width', 0.5)
                  .style('cursor', 'pointer')
                  .on('click', () => {
                    // Filter to this specific day when clicked
                    if (this.daySelect) {
                      this.daySelect.value = dateString;
                      this._selectedDay = dateString;
                      this.setAttribute('selected-day', dateString);
                      
                      // Switch back to list view to show filtered results
                      this.calendarModeCheckbox.checked = false;
                      this.setAttribute('calendar-mode', 'false');
                      this.onCalendarModeChanged();
                    }
                  })
                  .append('title')
                  .text(`${dateString} ${hour}:${minutes.toString().padStart(2, '0')}-${(minutes + 15).toString().padStart(2, '0')}\n${slotMessages} messages\n${humanReadable(slotData.tokens)} tokens\n${inDollar(slotCost)}${slotCost > maxCostPer15Min ? ' (capped at $3.00 for color)' : ''}`);
              } else {
                // Empty 15-minute slot
                chart.append('rect')
                  .attr('class', 'calendar-15min-empty')
                  .attr('x', slotX)
                  .attr('y', slotY)
                  .attr('width', slotWidth)
                  .attr('height', slotHeight)
                  .attr('fill', '#f5f5f5')
                  .attr('stroke', '#e8e8e8')
                  .attr('stroke-width', 0.5)
                  .style('cursor', 'pointer')
                  .on('click', () => {
                    // Filter to this specific day when clicked
                    if (this.daySelect) {
                      this.daySelect.value = dateString;
                      this._selectedDay = dateString;
                      this.setAttribute('selected-day', dateString);
                      
                      // Switch back to list view to show filtered results
                      this.calendarModeCheckbox.checked = false;
                      this.setAttribute('calendar-mode', 'false');
                      this.onCalendarModeChanged();
                    }
                  })
                  .append('title')
                  .text(`${dateString} ${hour}:${minutes.toString().padStart(2, '0')}-${(minutes + 15).toString().padStart(2, '0')}\nNo activity`);
              }
            }
          }
        }
        
        currentDate.add(1, 'day');
      }
    }
  }

  
  
}
