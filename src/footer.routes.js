// Material Kit 2 React components
import MKTypography from "components/MKTypography";

const date = new Date().getFullYear();

export default {
  brand: {
    name: "",
    route: "/",
  },
  socials: [],
  menus: [],
  copyright: (
    <MKTypography variant="button" fontWeight="regular">
      Copyright &copy; {date} Dolpha. All rights reserved.
    </MKTypography>
  ),
};
