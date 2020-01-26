import _ from 'src/external/lodash/lodash.js'

export default async ({ tags }) =>
  <ul class='tag-list'>
    {...await Promise.all(
      _.map(tags, tag => (
        <li class='tag-default tag-pill tag-outline'>
          { tag }
        </li>
      ))
    )}
  </ul>