import { useEffect } from 'react'
import Icon from './Icon.jsx'

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 2600);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="ok"><Icon name="check" size={16}/></span>
      {message}
    </div>
  );
};

export default Toast;
