import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  RadioGroup,
  FormControl,
  FormLabel,
  Radio,
  Checkbox,
  Slider,
  CircularProgress,
  Badge,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem as MuiMenuItem,
  Tooltip,
  Box,
  Grid,
  Alert
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Save,
  Settings,
  Info,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  MoreHoriz
} from '@mui/icons-material';

const MaterialShowcase: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [switchChecked, setSwitchChecked] = useState(false);
  const [radioValue, setRadioValue] = useState('option1');
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [dropdownValue, setDropdownValue] = useState('');
  const [sliderValue, setSliderValue] = useState<number | number[]>(50);
  const [showDialog, setShowDialog] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 1200, mx: 'auto', p: 4 }}>
      <Box>
        <Typography variant="h4">Material UI Components Showcase</Typography>
        <Typography>This page demonstrates various Material UI components integrated into your application.</Typography>
      </Box>

      {/* Typography Section */}
      <Box>
        <Typography variant="h5" gutterBottom>Typography</Typography>
        <Card>
          <CardContent>
            <Typography variant="h4">Title 1 - Main headings</Typography>
            <Typography variant="h5">Title 2 - Section headings</Typography>
            <Typography variant="h6">Title 3 - Subsection headings</Typography>
            <Typography>Body 1 - Regular text content for most use cases</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Buttons Section */}
      <Box>
        <Typography variant="h5" gutterBottom>Buttons</Typography>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="contained" startIcon={<Add />}>Primary</Button>
              <Button variant="outlined" startIcon={<Edit />}>Secondary</Button>
              <Button variant="text" startIcon={<Save />}>Outline</Button>
              <Button variant="text" startIcon={<Settings />}>Subtle</Button>
              <Button variant="text" startIcon={<Delete />}>Transparent</Button>
              <Button disabled startIcon={<Info />}>Disabled</Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Form Controls Section */}
      <Box>
        <Typography variant="h5" gutterBottom>Form Controls</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title={<Typography variant="h6">Input Controls</Typography>} />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Input Field"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <Typography variant="body2">Dropdown</Typography>
                      <Select
                        value={dropdownValue}
                        onChange={(e) => setDropdownValue(String(e.target.value))}
                        displayEmpty
                      >
                        <MenuItem value="">Select an option</MenuItem>
                        <MenuItem value="option1">Option 1</MenuItem>
                        <MenuItem value="option2">Option 2</MenuItem>
                        <MenuItem value="option3">Option 3</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2 }}>
                  <TextField
                    label="Textarea"
                    value={textareaValue}
                    onChange={(e) => setTextareaValue(e.target.value)}
                    placeholder="Enter multiline text..."
                    rows={3}
                    multiline
                    fullWidth
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title={<Typography variant="h6">Selection Controls</Typography>} />
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={<Switch checked={switchChecked} onChange={(e) => setSwitchChecked(e.target.checked)} />}
                    label="Enable notifications"
                  />

                  <FormControlLabel
                    control={<Checkbox checked={checkboxChecked} onChange={(e) => setCheckboxChecked(e.target.checked)} />}
                    label="I agree to the terms"
                  />

                  <FormControl>
                    <FormLabel>Radio Group</FormLabel>
                    <RadioGroup value={radioValue} onChange={(e) => setRadioValue((e.target as HTMLInputElement).value)}>
                      <FormControlLabel value="option1" control={<Radio />} label="Option 1" />
                      <FormControlLabel value="option2" control={<Radio />} label="Option 2" />
                      <FormControlLabel value="option3" control={<Radio />} label="Option 3" />
                    </RadioGroup>
                  </FormControl>

                  <Box>
                    <Typography>Slider: {sliderValue}</Typography>
                    <Slider value={typeof sliderValue === 'number' ? sliderValue : 0} onChange={(_e, v) => setSliderValue(v)} min={0} max={100} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Message Bars Section */}
      <Box>
        <Typography variant="h5" gutterBottom>Alerts</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Alert severity="info" icon={<Info />}>This is an informational message.</Alert>
          <Alert severity="success" icon={<CheckCircle />}>Operation completed successfully!</Alert>
          <Alert severity="warning" icon={<Warning />}>Please review your input before proceeding.</Alert>
          <Alert severity="error" icon={<ErrorIcon />}>An error occurred while processing your request.</Alert>
        </Box>
      </Box>

      {/* Badges and Status Section */}
      <Box>
        <Typography variant="h5" gutterBottom>Badges & Status</Typography>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Badge badgeContent={0} color="primary">Brand</Badge>
              <Badge badgeContent={1} color="success">Success</Badge>
              <Badge badgeContent={2} color="warning">Warning</Badge>
              <Badge badgeContent={3} color="error">Danger</Badge>
              <CircularProgress size={20} />
              <CircularProgress size={36} />
              <Avatar alt="John Doe">JD</Avatar>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Interactive Components Section */}
      <Box>
        <Typography variant="h5" gutterBottom>Interactive Components</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={() => setShowDialog(true)}>Open Dialog</Button>
          <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
            <DialogTitle>Sample Dialog</DialogTitle>
            <DialogContent>
              This is a sample dialog using Material UI components. You can use dialogs for confirmations, forms, or detailed information.
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button variant="contained" onClick={() => setShowDialog(false)}>Confirm</Button>
            </DialogActions>
          </Dialog>

          <div>
            <Button variant="outlined" onClick={(e) => setMenuAnchor(e.currentTarget)} startIcon={<MoreHoriz />}>Menu</Button>
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
                <MuiMenuItem onClick={() => setMenuAnchor(null)}>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                    <Add fontSize="small" />
                    New Item
                  </Box>
                </MuiMenuItem>
                <MuiMenuItem onClick={() => setMenuAnchor(null)}>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                    <Edit fontSize="small" />
                    Edit
                  </Box>
                </MuiMenuItem>
                <MuiMenuItem onClick={() => setMenuAnchor(null)}>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                    <Delete fontSize="small" />
                    Delete
                  </Box>
                </MuiMenuItem>
            </Menu>
          </div>

          <Tooltip title="This is a helpful tooltip">
            <Button variant="text" startIcon={<Info />}>Hover for tooltip</Button>
          </Tooltip>
        </Box>
      </Box>

      <Divider />

      <Box>
        <Typography>
          🎉 Material UI has been successfully integrated into your React application!
          You now have access to a comprehensive design system with consistent styling,
          accessibility features, and a wide range of components.
        </Typography>
      </Box>
    </Box>
  );
};

export default MaterialShowcase;
