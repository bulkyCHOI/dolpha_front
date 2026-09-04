import PropTypes from "prop-types";
import Flatpickr from "react-flatpickr";
import TextField from "@mui/material/TextField";
import { COLORS } from "constants/styles";

import "flatpickr/dist/flatpickr.css";

/**
 * flatpickr 기반 날짜 선택 입력 (Chartbook 버전).
 *
 * MKDatePicker(Material Kit)를 대체한다. 프로젝트 소유 컴포넌트이며
 * 입력 필드는 MUI TextField를 쓴다.
 * Chartbook 디자인: 헤어라인 테두리, 2px 라운드, 지면 배경
 *
 * @param {object} input TextField에 그대로 전달할 props
 */
function DatePicker({ input, ...rest }) {
  return (
    <Flatpickr
      {...rest}
      render={({ defaultValue }, ref) => (
        <TextField
          {...input}
          defaultValue={defaultValue}
          inputRef={ref}
          fullWidth
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: COLORS.CHARTBOOK.GROUND,
              borderRadius: "2px",
              "& fieldset": {
                borderColor: COLORS.CHARTBOOK.GRID,
                borderWidth: "1px",
              },
              "&:hover fieldset": {
                borderColor: COLORS.CHARTBOOK.GRID,
              },
              "&.Mui-focused fieldset": {
                borderColor: COLORS.CHARTBOOK.INK,
                borderWidth: "1px",
              },
            },
            "& .MuiInputBase-input": {
              fontFamily: "'Fragment Mono', 'Monaco', monospace",
              fontVariantNumeric: "tabular-nums",
            },
          }}
        />
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
