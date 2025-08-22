import d3 from "src/external/d3.v5.js";
import moment from "src/external/moment.js";

import ClaudeSessions from 'src/client/claude-sessions.js';

const humanReadable = ClaudeSessions.formatNumber
const inDollar = ClaudeSessions.formatDollarAmount


export default class ClaudeStatisticsSessionChart {
  
  static create(container, sessionData, livelyClaudeStatistics) {
    if (!sessionData || sessionData.costProgression.length === 0) {
      container.innerHTML = '<div style="padding: 20px; color: #666;">No data available</div>';
      return;
    }
    
    // Chart dimensions - compact view controls spacing and bar width
    const messageCount = sessionData.costProgression.length;
    const compactView = livelyClaudeStatistics.isCompactViewEnabled();
    
    // Adjust bar width and spacing based on compact view
    const barWidth = compactView ? 5 : 10; // Half width in compact view
    const barSpacing = compactView ? 1 : 2; // Tighter spacing in compact view
    
    const margin = { top: 20, right: 40, bottom: 150, left: 60 }; // More space for rotated timestamps
    const height = 250;
    
    let width;
    if (compactView) {
      // Compact: use actual count of messages (no gaps, half width bars)
      width = messageCount * (barWidth + barSpacing) + margin.left + margin.right;
    } else {
      // Preserve original JSONL line gaps (full width bars)
      const messageIndices = sessionData.costProgression.map(p => p.messageIndex);
      const minIndex = Math.min(...messageIndices);
      const maxIndex = Math.max(...messageIndices);
      const indexRange = maxIndex - minIndex + 1;
      width = indexRange * (barWidth + barSpacing) + margin.left + margin.right;
    }
    
    // Create SVG using D3
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height + margin.top + margin.bottom)
      .style('width', width + 'px')
      .style('height', (height + margin.top + margin.bottom) + 'px');
    
    // Enable horizontal scrolling for parent container
    if (width > container.parentElement.offsetWidth) {
      container.parentElement.style.overflowX = 'auto';
    }
    
    // Scales - Fixed max cost at 30k to avoid outlier scaling issues
    const maxCost = 50000;
    
    const yScale = d3.scaleLinear()
      .domain([0, maxCost])
      .range([height + margin.top, margin.top]);
    
    // Color scale for cost types
    const colors = {
      inputCost: '#2196f3',
      outputCost: '#4caf50', 
      cacheReadCost: '#8d6e63',
      cacheWriteCost: '#424242'
    };
    
    // Create main chart group
    const chart = svg.append('g');
    
    // Stack keys in order (bottom to top)
    const stackKeys = ['inputCost', 'outputCost', 'cacheReadCost', 'cacheWriteCost'];
    
    // Pre-calculate positioning data for non-compact mode
    let minIndex = 0;
    if (!compactView) {
      const messageIndices = sessionData.costProgression.map(p => p.messageIndex);
      minIndex = Math.min(...messageIndices);
    }
    
    // Create stacked bars (including empty boxes for user messages)
    sessionData.costProgression.forEach((point, arrayIndex) => {
      // Position based on compact view setting
      let x;
      if (compactView) {
        // Compact: use array index (no gaps)
        x = margin.left + arrayIndex * (barWidth + barSpacing);
      } else {
        // Preserve gaps: use original JSONL line positions
        const messagePosition = point.messageIndex - minIndex;
        x = margin.left + messagePosition * (barWidth + barSpacing);
      }
      let yOffset = 0; // Track cumulative height
      
      // Check if detailed cost breakdown mode is enabled
      const showDetailedCosts = livelyClaudeStatistics.isDetailedCostsEnabled();

      if (point.isUserMessage) {
        // Render user message as empty box with blue border (matching session viewer)
        const emptyBoxHeight = 20; // Fixed height for user messages
        const y = yScale(0) - emptyBoxHeight;
        
        // Check if this UUID has been seen before
        const isDuplicate = livelyClaudeStatistics._globalMessageUUIDs.has(point.uuid);
        livelyClaudeStatistics._globalMessageUUIDs.add(point.uuid);
        
        chart.append('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', barWidth)
          .attr('height', emptyBoxHeight)
          .attr('fill', '#f8fbff') // Light blue background matching session viewer
          .attr('stroke', '#2196f3') // Blue border matching session viewer
          .attr('stroke-width', 2)
          .attr('opacity', isDuplicate ? 0.4 : 1.0) // Make duplicate messages translucent
          .attr('cursor', 'pointer')
          .on('click', () => {
            livelyClaudeStatistics.navigateToMessageInExistingViewer(sessionData.filePath, point.uuid);
          })
          .append('title')
          .text(`User Message #${point.messageIndex}${isDuplicate ? ' (DUPLICATE)' : ''}
${
                point.sessionEntry.message.content[0].text ? 
                  point.sessionEntry.message.content[0].text.slice(0,100)  :
                  point.sessionEntry.message.content.slice(0,100)
                }`);
      } else {
        const totalCost = Object.values(point.costBreakdown).reduce((sum, cost) => sum + cost, 0);
        if (totalCost > 0) {
          // Check if this UUID has been seen before
          const isDuplicate = livelyClaudeStatistics._globalMessageUUIDs.has(point.uuid);
          livelyClaudeStatistics._globalMessageUUIDs.add(point.uuid);
          
          if (showDetailedCosts) {
            // Detailed mode: Show stacked cost breakdown with shared purple border
            const totalBarHeight = yScale(0) - yScale(totalCost);
            const backgroundY = yScale(totalCost);
            
            // Add background rectangle with purple border for the entire stack
            chart.append('rect')
              .attr('x', x - 1) // Slightly wider to encompass the stack
              .attr('y', backgroundY - 1)
              .attr('width', barWidth + 2)
              .attr('height', totalBarHeight + 2)
              .attr('fill', 'none')
              .attr('stroke', 'none') 
              .attr('stroke-width', 0)
              .attr('opacity', isDuplicate ? 0.4 : 1.0) // Make duplicate messages translucent
              .attr('cursor', 'pointer')
              .on('click', () => {
                livelyClaudeStatistics.navigateToMessageInExistingViewer(sessionData.filePath, point.uuid);
              });
            
            // Render individual cost segments
            stackKeys.forEach(key => {
              const costValue = point.costBreakdown[key];
              if (costValue > 0) {
                const barHeight = yScale(0) - yScale(costValue);
                const y = yScale(0) - yOffset - barHeight;
                
                chart.append('rect')
                  .attr('x', x)
                  .attr('y', y)
                  .attr('width', barWidth)
                  .attr('height', barHeight)
                  .attr('fill', colors[key])
                  .attr('opacity', isDuplicate ? 0.4 : 1.0) // Make duplicate messages translucent
                  .attr('cursor', 'pointer')
                  .on('click', () => {
                    this.navigateToMessageInExistingViewer(sessionData.filePath, point.uuid);
                  })
                  .append('title')
                  .text(`Assistant Message #${point.messageIndex}${isDuplicate ? ' (DUPLICATE)' : ''}
${key.replace('Cost', '')}: ${humanReadable(costValue)} tokens (${inDollar(ClaudeSessions.calculateDollarCostForType(costValue, key))})

${point.sessionEntry.message.content[0].text ? point.sessionEntry.message.content[0].text.slice(0,100)  : ""}`);
                yOffset += barHeight;
              }
            });
          } else {
            // Simple mode: Single purple bar for total cost
            const totalBarHeight = yScale(0) - yScale(totalCost);
            const y = yScale(totalCost);
            
            chart.append('rect')
              .attr('x', x)
              .attr('y', y)
              .attr('width', barWidth)
              .attr('height', totalBarHeight)
              .attr('fill', '#9c27b0') // Purple fill matching session viewer
              .attr('stroke', '#9c27b0')
              .attr('stroke-width', 1)
              .attr('opacity', isDuplicate ? 0.4 : 1.0) // Make duplicate messages translucent
              .attr('cursor', 'pointer')
              .on('click', () => {
                this.navigateToMessageInExistingViewer(sessionData.filePath, point.uuid);
              })
              .append('title')
              .text(`Assistant Message #${point.messageIndex}${isDuplicate ? ' (DUPLICATE)' : ''}
Total Cost: ${humanReadable(totalCost)} tokens (${inDollar(ClaudeSessions.calculateDollarCost(point.tokens).totalCost)})
${point.sessionEntry.message.content[0].text ? point.sessionEntry.message.content[0].text.slice(0,100)  : ""}`);
          }
        }
      }
    });
    
    // X-axis - smart timestamp selection and response time calculation
    const intelligentTickData = [];
    
    sessionData.costProgression.forEach((point, arrayIndex) => {
      const showTimestamp = point.isUserMessage || // Always show for user messages
        (arrayIndex > 0 && sessionData.costProgression[arrayIndex + 1]?.isUserMessage); // Show for AI response before user message
      
      if (showTimestamp && point.timestamp) {
        // Simple moment.js formatting - no cleverness, just reliable parsing
        let formattedTime = 'Invalid';
        
        try {
          // Use the original timestamp string from sessionEntry
          const originalTimestamp = point.sessionEntry.timestamp;
          
          if (originalTimestamp) {
            // Parse with moment.js and format as HH:mm:ss
            const momentObj = moment(originalTimestamp);
            
            if (momentObj.isValid()) {
              formattedTime = momentObj.format('HH:mm:ss');
            } else {
              formattedTime = 'Invalid';
            }
          }
        } catch (error) {
          formattedTime = 'Error';
        }
        
        const tickItem = {
          messageIndex: point.messageIndex,
          arrayIndex,
          timestamp: point.timestamp, // Use the existing parsed timestamp
          isUserMessage: point.isUserMessage,
          formattedTime: formattedTime
        };
        
        // Calculate response time if this is an AI response before a user message
        if (!point.isUserMessage && arrayIndex > 0 && sessionData.costProgression[arrayIndex + 1]?.isUserMessage) {
          // Find the previous user message to calculate response time
          for (let i = arrayIndex - 1; i >= 0; i--) {
            const prevMessage = sessionData.costProgression[i];
            if (prevMessage.isUserMessage && prevMessage.timestamp) {
              // Use moment.js for reliable time difference calculation
              const responseTimeMs = moment(point.timestamp).diff(moment(prevMessage.timestamp));
              const responseTimeSeconds = Math.round(responseTimeMs / 1000);
              tickItem.responseTime = responseTimeSeconds;
              tickItem.responseLabel = responseTimeSeconds < 60 
                ? `${responseTimeSeconds}s` 
                : `${Math.floor(responseTimeSeconds / 60)}m${responseTimeSeconds % 60}s`;
              break;
            }
          }
        }
        
        intelligentTickData.push(tickItem);
      }
    });
    
    // Also show regular index ticks for every 10th message for reference
    const regularTickData = sessionData.costProgression
      .map((point, arrayIndex) => ({ 
        messageIndex: point.messageIndex, 
        arrayIndex, 
        timestamp: point.timestamp
      }))
      .filter((item, i, arr) => {
        return i % 10 === 0 || i === 0 || i === arr.length - 1;
      });
    
    // Message index labels (top line) - show every 10th for reference
    chart.selectAll('.x-tick-index')
      .data(regularTickData)
      .enter()
      .append('text')
      .attr('class', 'x-tick-index')
      .attr('x', d => {
        if (compactView) {
          return margin.left + d.arrayIndex * (barWidth + barSpacing) + barWidth / 2;
        } else {
          const messagePosition = d.messageIndex - minIndex;
          return margin.left + messagePosition * (barWidth + barSpacing) + barWidth / 2;
        }
      })
      .attr('y', height + margin.top + 12)
      .attr('text-anchor', 'middle')
      .style('font-size', '9px')
      .style('fill', '#aaa')
      .text(d => d.messageIndex);
    
    // Smart timestamp labels (rotated 45 degrees)
    chart.selectAll('.x-tick-time')
      .data(intelligentTickData)
      .enter()
      .append('text')
      .attr('class', 'x-tick-time')
      .attr('x', d => {
        let baseX;
        if (compactView) {
          baseX = margin.left + d.arrayIndex * (barWidth + barSpacing) + barWidth / 2;
        } else {
          const messagePosition = d.messageIndex - minIndex;
          baseX = margin.left + messagePosition * (barWidth + barSpacing) + barWidth / 2;
        }
        // Offset user messages 5px right, non-user messages 5px left
        return baseX + (d.isUserMessage ? 5 : -5);
      })
      .attr('y', height + margin.top + 60)
      .attr('text-anchor', 'start')
      .attr('transform', d => {
        let baseX = compactView 
          ? margin.left + d.arrayIndex * (barWidth + barSpacing) + barWidth / 2
          : margin.left + (d.messageIndex - minIndex) * (barWidth + barSpacing) + barWidth / 2;
        // Apply same offset as x position
        const x = baseX + (d.isUserMessage ? 5 : -5);
        return `rotate(45, ${x}, ${height + margin.top + 45})`;
      })
      .style('font-size', '8px')
      .style('fill', d => d.isUserMessage ? '#2196f3' : '#9c27b0') // Blue for user, purple for AI
      .text(d => {
        const momentParsed = moment(d.timestamp);
        const formatted = momentParsed.isValid() ? momentParsed.format('HH:mm:ss') : 'INVALID';
        return `${formatted}`;
      });
    
    // Response time labels (horizontal, middle position)
    chart.selectAll('.x-response-time')
      .data(intelligentTickData.filter(d => d.responseTime))
      .enter()
      .append('text')
      .attr('class', 'x-response-time')
      .attr('x', d => {
        if (compactView) {
          return margin.left + d.arrayIndex * (barWidth + barSpacing) + barWidth / 2;
        } else {
          const messagePosition = d.messageIndex - minIndex;
          return margin.left + messagePosition * (barWidth + barSpacing) + barWidth / 2;
        }
      })
      .attr('y', height + margin.top + 100)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#e91e63') // Pink color for response times
      .style('cursor', 'help')
      .text(d => d.responseLabel)
      .append('title')
      .text(d => {
        const aiTime = moment(d.timestamp).format('YYYY-MM-DD HH:mm:ss');
        
        return `AI Response Time: ${d.responseLabel} (${d.responseTime} seconds)\n` +
               `AI response completed at: ${aiTime}\n` +
               `Message #${d.messageIndex}\n` +
               `This is the time from user question to AI response completion`;
      });
    
    // Hour and day markers (show under first message of each time period)
    const hourMarkers = [];
    const dayMarkers = [];
    const seenHours = new Set();
    const seenDays = new Set();
    
    // Process each message to find first occurrence of each hour/day
    sessionData.costProgression.forEach((msg, arrayIndex) => {
      if (!msg.timestamp) return;
      
      const msgMoment = moment(msg.timestamp);
      if (!msgMoment.isValid()) return;
      
      const dayKey = msgMoment.format('YYYY-MM-DD');
      const hourKey = msgMoment.format('YYYY-MM-DD-HH');
      
      // Add day marker for first message of each day
      if (!seenDays.has(dayKey)) {
        seenDays.add(dayKey);
        dayMarkers.push({
          arrayIndex: arrayIndex,
          messageIndex: msg.messageIndex,
          dayLabel: dayKey,
          timestamp: msg.timestamp
        });
      }
      
      // Add hour marker for first message of each hour
      if (!seenHours.has(hourKey)) {
        seenHours.add(hourKey);
        
        // Only skip hour marker if this isn't the first message of a new day AND it's not the very first message
        const isFirstDayOccurrence = dayMarkers.some(d => 
          d.arrayIndex === arrayIndex && d.dayLabel === dayKey
        );
        const isVeryFirstMessage = arrayIndex === 0;
        
        if (!isFirstDayOccurrence || isVeryFirstMessage) {
          hourMarkers.push({
            arrayIndex: arrayIndex,
            messageIndex: msg.messageIndex,
            hourLabel: msgMoment.format('HH:00'),
            timestamp: msg.timestamp
          });
        }
      }
    });
    
    // Render hour markers
    chart.selectAll('.x-hour-marker')
      .data(hourMarkers)
      .enter()
      .append('text')
      .attr('class', 'x-hour-marker')
      .attr('x', d => {
        if (compactView) {
          return margin.left + d.arrayIndex * (barWidth + barSpacing) + barWidth / 2;
        } else {
          const messagePosition = d.messageIndex - minIndex;
          return margin.left + messagePosition * (barWidth + barSpacing) + barWidth / 2;
        }
      })
      .attr('y', height + margin.top + 90)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#ff9800') // Orange color for hour markers
      .style('cursor', 'help')
      .text(d => d.hourLabel)
      .append('title')
      .text(d => `First message of ${d.hourLabel} hour\nMessage #${d.messageIndex} at ${moment(d.timestamp).format('HH:mm:ss')}`);
    
    // Render day markers
    chart.selectAll('.x-day-marker')
      .data(dayMarkers)
      .enter()
      .append('text')
      .attr('class', 'x-day-marker')
      .attr('x', d => {
        if (compactView) {
          return margin.left + d.arrayIndex * (barWidth + barSpacing) + barWidth / 2;
        } else {
          const messagePosition = d.messageIndex - minIndex;
          return margin.left + messagePosition * (barWidth + barSpacing) + barWidth / 2;
        }
      })
      .attr('y', height + margin.top + 120)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#e91e63') // Pink/red color for day markers (more prominent)
      .style('cursor', 'help')
      .text(d => d.dayLabel)
      .append('title')
      .text(d => `First message of ${d.dayLabel}\nMessage #${d.messageIndex} at ${moment(d.timestamp).format('HH:mm:ss')}`);
    
    // Y-axis token labels (left side)
    const yTicks = yScale.ticks(5);
    chart.selectAll('.y-tick')
      .data(yTicks)
      .enter()
      .append('text')
      .attr('class', 'y-tick')
      .attr('x', margin.left - 10)
      .attr('y', d => yScale(d) + 4)
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .style('fill', '#666')
      .text(d => d >= 10000 ? `${Math.round(d / 1000)}k` : Math.round(d));
    
    // Y-axis dollar labels (right side)
    chart.selectAll('.y-tick-dollar')
      .data(yTicks)
      .enter()
      .append('text')
      .attr('class', 'y-tick-dollar')
      .attr('x', width - margin.right + 10)
      .attr('y', d => yScale(d) + 4)
      .attr('text-anchor', 'start')
      .style('font-size', '10px')
      .style('fill', '#888')
      .text(d => {
        // Convert weighted token cost to approximate dollar cost
        // This is an approximation since we don't know the exact token breakdown at this level
        // Using average weights: ~60% output (3x), ~30% input (1x), ~10% cache (0.1x) 
        const avgWeightedTokens = d;
        const approxDollarCost = (avgWeightedTokens * 0.6 / 3.0 / 1000000 * ClaudeSessions.PRICING.output) + 
                                (avgWeightedTokens * 0.3 / 1000000 * ClaudeSessions.PRICING.baseInput) +
                                (avgWeightedTokens * 0.1 / 0.1 / 1000000 * ClaudeSessions.PRICING.cacheHit);
        return inDollar(approxDollarCost);
      });
    
    // Axis lines
    chart.append('line')
      .attr('x1', margin.left)
      .attr('x2', margin.left)
      .attr('y1', margin.top)
      .attr('y2', height + margin.top)
      .attr('stroke', '#666')
      .attr('stroke-width', 1);
    
    chart.append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', height + margin.top)
      .attr('y2', height + margin.top)
      .attr('stroke', '#666')
      .attr('stroke-width', 1);
    
    // Axis labels
    chart.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.top + margin.bottom - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text('Message Index & Timestamp');
    
    chart.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(height + margin.top) / 2)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text('Cost (tokens / dollars)');
    
    // Right Y-axis label for dollars
    chart.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(height + margin.top) / 2)
      .attr('y', width - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#888')
      .text('$ (approx)');
    
    return svg.node();
  }

  
  
}
