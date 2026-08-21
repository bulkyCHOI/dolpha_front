import PropTypes from "prop-types";
import Flatpickr from "react-flatpickr";
import TextField from "@mui/material/TextField";

import "flatpickr/dist/flatpickr.css";

/**
 * flatpickr 기반 날짜 선택 입력.
 *
 * MKDatePicker(Material Kit)를 대체한다. 프로젝트 소유 컴포넌트이며
 * 입력 필드는 MUI TextField를 쓴다.
 *
 * @param {object} input TextField에 그대로 전달할 props
 */
function DatePicker({ input, ...rest }) {
  return (
    <Flatpickr
      {...rest}
      render={({ defaultValue }, ref) => (
        <TextField {...input} defaultValue={defaultValue} inputRef={ref} fullWidth />
      )}
    />
  );
}

DatePicker.propTypes = {
  input: PropTypes.object,
};

DatePicker.defaultProps = {
  input: {},
};

export default DatePicker;
