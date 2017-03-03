import React, { PropTypes } from 'react';

import { Row, Data, Dropdown } from '../../vanilla/table-interactive';

const NameMismatchDropdown = (props) => {
  const { snapcraft_data, store_name } = props.snap;

  return (
    <Dropdown>
      <Row>
        <Data col="100">
          <p>
            The snapcraft.yaml uses the snap name “{snapcraft_data.name}”,
            but you’ve registered the name “{store_name}”.
          </p>
        </Data>
      </Row>
    </Dropdown>
  );
};

NameMismatchDropdown.propTypes = {
  snap: PropTypes.shape({
    store_name: PropTypes.string,
    snapcraft_data: PropTypes.shape({
      name: PropTypes.string
    })
  })
};

export default NameMismatchDropdown;
