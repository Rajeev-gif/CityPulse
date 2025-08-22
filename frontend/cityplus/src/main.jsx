import React from "react";
import ReactDOM from "react-dom/client";
import {
  ChakraProvider,
  extendTheme as extendChakraTheme,
} from "@chakra-ui/react";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from "@mui/material/styles";
import App from "./App.jsx";

const chakraTheme = extendChakraTheme({});
const muiTheme = createTheme();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ChakraProvider theme={chakraTheme}>
      <MuiThemeProvider theme={muiTheme}>
        <App />
      </MuiThemeProvider>
    </ChakraProvider>
  </React.StrictMode>
);
