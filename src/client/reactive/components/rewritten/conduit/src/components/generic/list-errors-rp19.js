import _ from 'src/external/lodash/lodash.js'

export default ({ errors }) =>
  errors && (
    <ul class='error-messages'>
      { ...
        _.map(_.toPairs(errors), ([key, value]) =>
          <li>{ key } { value }</li>
        )
      }  
    </ul>
  );