import _ from 'src/external/lodash/lodash.js'

export default async ({ tags }) => 
  tags ? (
    <div class='tag-list'>
      {...await Promise.all(
        _.map(tags, tag => (
          <link-rp19
            v-targetDestination={{
              target: 'home',
              tab: 'tag',
              tag
            }}
            className='tag-default tag-pill'
          >
            { tag }
          </link-rp19>
        ))
      )}
    </div>
  ) : (
    <loading-spinner-rp19 />
  );

