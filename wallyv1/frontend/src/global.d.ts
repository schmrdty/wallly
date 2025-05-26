import 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'appkit-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

export {};