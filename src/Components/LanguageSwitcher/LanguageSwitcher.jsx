import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Menu, MenuItem, Button, ListItemIcon, ListItemText } from '@mui/material';
import './LanguageSwitcher.scss';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'kg', label: 'Кыргызча', flag: '🇰🇬' }
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  
  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    handleClose();
    // Save language preference to localStorage
    localStorage.setItem('i18nextLng', langCode);
  };
  
  // Find current language
  const currentLanguage = LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[0];
  
  return (
    <Box className="language-switcher">
      <Button 
        onClick={handleOpen}
        sx={{ 
          minWidth: 'auto',
          color: 'inherit',
          fontSize: '14px',
          borderRadius: '20px',
          padding: '6px 12px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(5px)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
          }
        }}
      >
        <span style={{ marginRight: '6px' }}>{currentLanguage.flag}</span> 
        {currentLanguage.code.toUpperCase()}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          style: {
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            minWidth: '160px',
            marginTop: '8px'
          }
        }}
      >
        {LANGUAGES.map((language) => (
          <MenuItem 
            key={language.code} 
            onClick={() => handleLanguageChange(language.code)}
            selected={i18n.language === language.code}
            sx={{ 
              padding: '10px 16px',
              '&.Mui-selected': {
                backgroundColor: 'rgba(58, 54, 224, 0.1)',
              },
              '&:hover': {
                backgroundColor: 'rgba(58, 54, 224, 0.05)',
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: '30px' }}>
              {language.flag}
            </ListItemIcon>
            <ListItemText 
              primary={language.label} 
              primaryTypographyProps={{
                sx: { 
                  fontWeight: i18n.language === language.code ? '600' : '400',
                  color: i18n.language === language.code ? '#3a36e0' : 'inherit'
                }
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default LanguageSwitcher; 