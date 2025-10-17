import React, { useState } from 'react';
import {
  makeStyles,
  Title1,
  Title2,
  Title3,
  Body1,
  Card,
  CardHeader,
  Button,
  Input,
  Textarea,
  Switch,
  RadioGroup,
  Radio,
  Checkbox,
  Dropdown,
  Option,
  Slider,
  Spinner,
  Badge,
  Avatar,
  Divider,
  MessageBar,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Tooltip
} from '@fluentui/react-components';
import {
  Add,
  Delete,
  Edit,
  Save,
  Settings,
  Info,
  Warning,
  CheckCircle,
  Error,
  MoreHoriz
} from '@mui/icons-material';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1rem'
  },
  card: {
    padding: '1rem'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr'
    }
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap'
  },
  badgeGroup: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    flexWrap: 'wrap'
  }
});

const FluentShowcase: React.FC = () => {
  const styles = useStyles();
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [switchChecked, setSwitchChecked] = useState(false);
  const [radioValue, setRadioValue] = useState('option1');
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [dropdownValue, setDropdownValue] = useState('');
  const [sliderValue, setSliderValue] = useState(50);
  const [showDialog, setShowDialog] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <Title1>Fluent UI Components Showcase</Title1>
        <Body1>This page demonstrates various Fluent UI React components integrated into your application.</Body1>
      </div>

      {/* Typography Section */}
      <div className={styles.section}>
        <Title2>Typography</Title2>
        <Card className={styles.card}>
          <Title1>Title 1 - Main headings</Title1>
          <Title2>Title 2 - Section headings</Title2>
          <Title3>Title 3 - Subsection headings</Title3>
          <Body1>Body 1 - Regular text content for most use cases</Body1>
        </Card>
      </div>

      {/* Buttons Section */}
      <div className={styles.section}>
        <Title2>Buttons</Title2>
        <Card className={styles.card}>
          <div className={styles.buttonGroup}>
            <Button appearance="primary" icon={<Add />}>Primary</Button>
            <Button appearance="secondary" icon={<Edit />}>Secondary</Button>
            <Button appearance="outline" icon={<Save />}>Outline</Button>
            <Button appearance="subtle" icon={<Settings />}>Subtle</Button>
            <Button appearance="transparent" icon={<Delete />}>Transparent</Button>
            <Button disabled icon={<Info />}>Disabled</Button>
          </div>
        </Card>
      </div>

      {/* Form Controls Section */}
      <div className={styles.section}>
        <Title2>Form Controls</Title2>
        <div className={styles.grid}>
          <Card className={styles.card}>
            <CardHeader header={<Title3>Input Controls</Title3>} />
            <div className={styles.formGrid}>
              <div>
                <label>Input Field</label>
                <Input
                  value={inputValue}
                  onChange={(_e, data) => setInputValue(data.value)}
                  placeholder="Enter some text..."
                />
              </div>
              <div>
                <label>Dropdown</label>
                <Dropdown
                  value={dropdownValue}
                  onOptionSelect={(_e, data) => setDropdownValue(data.optionValue || '')}
                  placeholder="Select an option"
                >
                  <Option value="option1">Option 1</Option>
                  <Option value="option2">Option 2</Option>
                  <Option value="option3">Option 3</Option>
                </Dropdown>
              </div>
            </div>
            <div>
              <label>Textarea</label>
              <Textarea
                value={textareaValue}
                onChange={(_e, data) => setTextareaValue(data.value)}
                placeholder="Enter multiline text..."
                rows={3}
              />
            </div>
          </Card>

          <Card className={styles.card}>
            <CardHeader header={<Title3>Selection Controls</Title3>} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <Switch
                  checked={switchChecked}
                  onChange={(_e, data) => setSwitchChecked(data.checked)}
                  label="Enable notifications"
                />
              </div>
              <div>
                <Checkbox
                  checked={checkboxChecked}
                  onChange={(_e, data) => setCheckboxChecked(data.checked === true)}
                  label="I agree to the terms"
                />
              </div>
              <div>
                <label>Radio Group</label>
                <RadioGroup
                  value={radioValue}
                  onChange={(_e, data) => setRadioValue(data.value)}
                >
                  <Radio value="option1" label="Option 1" />
                  <Radio value="option2" label="Option 2" />
                  <Radio value="option3" label="Option 3" />
                </RadioGroup>
              </div>
              <div>
                <label>Slider: {sliderValue}</label>
                <Slider
                  value={sliderValue}
                  onChange={(_e, data) => setSliderValue(data.value)}
                  min={0}
                  max={100}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Message Bars Section */}
      <div className={styles.section}>
        <Title2>Message Bars</Title2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <MessageBar intent="info" icon={<Info />}>
            This is an informational message.
          </MessageBar>
          <MessageBar intent="success" icon={<CheckCircle />}>
            Operation completed successfully!
          </MessageBar>
          <MessageBar intent="warning" icon={<Warning />}>
            Please review your input before proceeding.
          </MessageBar>
          <MessageBar intent="error" icon={<Error />}>
            An error occurred while processing your request.
          </MessageBar>
        </div>
      </div>

      {/* Badges and Status Section */}
      <div className={styles.section}>
        <Title2>Badges & Status</Title2>
        <Card className={styles.card}>
          <div className={styles.badgeGroup}>
            <Badge appearance="filled" color="brand">Brand</Badge>
            <Badge appearance="outline" color="success">Success</Badge>
            <Badge appearance="tint" color="warning">Warning</Badge>
            <Badge appearance="filled" color="danger">Danger</Badge>
            <Badge appearance="outline" color="informative">Info</Badge>
            <Spinner size="small" />
            <Spinner size="medium" />
            <Avatar name="John Doe" />
          </div>
        </Card>
      </div>

      {/* Interactive Components Section */}
      <div className={styles.section}>
        <Title2>Interactive Components</Title2>
        <div className={styles.buttonGroup}>
          <Dialog open={showDialog} onOpenChange={(_e, data) => setShowDialog(data.open)}>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="primary">Open Dialog</Button>
            </DialogTrigger>
            <DialogSurface>
              <DialogBody>
                <DialogTitle>Sample Dialog</DialogTitle>
                <DialogContent>
                  This is a sample dialog using Fluent UI components. You can use dialogs for confirmations, forms, or detailed information.
                </DialogContent>
                <DialogActions>
                  <DialogTrigger disableButtonEnhancement>
                    <Button appearance="secondary">Cancel</Button>
                  </DialogTrigger>
                  <Button appearance="primary">Confirm</Button>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </Dialog>

          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button appearance="secondary" icon={<MoreHoriz />}>
                Menu
              </Button>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem icon={<Add />}>New Item</MenuItem>
                <MenuItem icon={<Edit />}>Edit</MenuItem>
                <MenuItem icon={<Delete />}>Delete</MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>

          <Tooltip content="This is a helpful tooltip" relationship="label">
            <Button appearance="outline" icon={<Info />}>
              Hover for tooltip
            </Button>
          </Tooltip>
        </div>
      </div>

      <Divider />
      
      <div className={styles.section}>
        <Body1>
          🎉 Fluent UI has been successfully integrated into your React application! 
          You now have access to a comprehensive design system with consistent styling, 
          accessibility features, and a wide range of components.
        </Body1>
      </div>
    </div>
  );
};

export default FluentShowcase;