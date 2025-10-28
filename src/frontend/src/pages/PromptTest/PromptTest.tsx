import React from 'react';
import { Prompt } from '../../components/Prompt/Prompt';
import styles from './PromptTest.module.css';

const PromptTest: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1>Prompt Component Test</h1>
      <div className={styles.card}>
        <Prompt value={''} />
      </div>
    </div>
  );
};

export default PromptTest;
