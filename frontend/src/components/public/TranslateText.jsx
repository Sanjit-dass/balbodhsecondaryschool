import React from 'react';
import { useTranslate } from '../../hooks/useTranslate';

const translatableProps = new Set([
  'alt',
  'placeholder',
  'title',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'value',
  'label',
  'subtitle',
  'header',
  'subtext',
  'caption',
  'summary',
  'buttonText',
  'description',
  'content',
  'text',
]);

const isPlainObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) && !React.isValidElement(value);

const TranslateText = ({ children }) => {
  const { t } = useTranslate();

  const translateValue = (value) => {
    if (typeof value === 'string') {
      return t(value);
    }

    if (Array.isArray(value)) {
      return React.Children.map(value, (item) => translateValue(item));
    }

    if (React.isValidElement(value)) {
      return translateElement(value);
    }

    if (isPlainObject(value)) {
      const translatedObject = {};
      Object.entries(value).forEach(([key, item]) => {
        translatedObject[key] = translateValue(item);
      });
      return translatedObject;
    }

    return value;
  };

  const translateElement = (element) => {
    const translatedChildren = translateValue(element.props.children);

    const translatedProps = Object.entries(element.props).reduce((result, [key, propValue]) => {
      if (key === 'children') {
        return result;
      }

      if (translatableProps.has(key)) {
        result[key] = translateValue(propValue);
      } else {
        result[key] = propValue;
      }

      return result;
    }, {});

    return React.cloneElement(element, translatedProps, translatedChildren);
  };

  return <>{translateValue(children)}</>;
};

export default TranslateText;
