import { LoginButton, LoginButtonType } from '../../components/LoginButton';
import './Login.css';

const Login: React.FC = () => {
  return (
    <div>
      <h1>Login Page</h1>
      <LoginButton type={LoginButtonType.Microsoft}/>
    </div>
  );
};

export default Login;
