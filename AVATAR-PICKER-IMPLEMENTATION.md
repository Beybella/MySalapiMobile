# Avatar Picker Implementation Guide

## Overview

I've successfully converted the beautiful Avatar Picker component from React web to React Native! This component allows users to select from 4 unique animated avatars and set a username.

## What Was Created

### Component File
**Location:** `mysalapi-app/components/AvatarPicker.tsx`

**Features:**
- ✨ 4 unique SVG avatars (Sunny, Midnight, Berry, Minty)
- 🎨 Animated avatar selection with ring effects
- 📝 Username input with validation (3-20 characters)
- ⚡ Smooth animations using React Native Animated API
- 🎯 Thumbnail strip with selection indicator
- ✅ Character counter with warning at 18+ chars
- 🚫 Error messaging for invalid usernames
- 🎨 Fully customizable colors and text
- 📱 Responsive and touch-friendly

## Where to Use It

### Option 1: Registration Flow
Add avatar selection during user registration:

**File:** `mysalapi-app/app/(auth)/register.tsx`

```typescript
import AvatarPicker from '../../components/AvatarPicker';
import { useTheme } from '../../context/ThemeContext';

// In your registration screen
const [showAvatarPicker, setShowAvatarPicker] = useState(false);
const { colors } = useTheme();

const handleAvatarComplete = async (data: { username: string; avatarId: number }) => {
  // Save to user profile
  await supabase
    .from('users')
    .update({ 
      username: data.username, 
      avatar_id: data.avatarId 
    })
    .eq('id', user.id);
  
  // Continue registration flow
  setShowAvatarPicker(false);
};

return (
  <Modal visible={showAvatarPicker} animationType="slide">
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <AvatarPicker
        onComplete={handleAvatarComplete}
        colors={{
          primary: colors.primary,
          background: colors.background,
          surface: colors.surface,
          textPrimary: colors.textPrimary,
          textSecondary: colors.textSecondary,
          border: colors.border,
          error: colors.error,
        }}
      />
    </View>
  </Modal>
);
```

### Option 2: Profile Screen
Allow users to change their avatar:

**File:** `mysalapi-app/app/(tabs)/profile.tsx`

```typescript
import AvatarPicker from '../../components/AvatarPicker';

const [editingProfile, setEditingProfile] = useState(false);
const [currentUsername, setCurrentUsername] = useState('');
const [currentAvatarId, setCurrentAvatarId] = useState(1);

const handleProfileUpdate = async (data: { username: string; avatarId: number }) => {
  const { error } = await supabase
    .from('users')
    .update({
      username: data.username,
      avatar_id: data.avatarId,
    })
    .eq('id', user.id);

  if (!error) {
    setCurrentUsername(data.username);
    setCurrentAvatarId(data.avatarId);
    setEditingProfile(false);
    Alert.alert('Success', 'Profile updated!');
  }
};

return (
  <Modal visible={editingProfile} animationType="slide">
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20, flex: 1, justifyContent: 'center' }}>
        <AvatarPicker
          initialUsername={currentUsername}
          initialAvatarId={currentAvatarId}
          title="Update Profile"
          subtitle="Change your avatar and username"
          buttonText="Save Changes"
          onComplete={handleProfileUpdate}
          colors={{
            primary: colors.primary,
            background: colors.background,
            surface: colors.surface,
            textPrimary: colors.textPrimary,
            textSecondary: colors.textSecondary,
            border: colors.border,
            error: colors.error,
          }}
        />
        <TouchableOpacity
          style={{ marginTop: 16, padding: 12, alignItems: 'center' }}
          onPress={() => setEditingProfile(false)}
        >
          <Text style={{ color: colors.textSecondary }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  </Modal>
);
```

### Option 3: First-Time Setup
Show after user completes registration:

```typescript
// In _layout.tsx or main app component
const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

useEffect(() => {
  checkProfileSetup();
}, [user]);

const checkProfileSetup = async () => {
  if (!user) return;
  
  const { data } = await supabase
    .from('users')
    .select('username, avatar_id')
    .eq('id', user.id)
    .single();
  
  if (!data?.username || !data?.avatar_id) {
    setNeedsProfileSetup(true);
  }
};

const handleSetupComplete = async (data: { username: string; avatarId: number }) => {
  await supabase
    .from('users')
    .update({
      username: data.username,
      avatar_id: data.avatarId,
      profile_completed: true,
    })
    .eq('id', user.id);
  
  setNeedsProfileSetup(false);
};

// Render
{needsProfileSetup && (
  <Modal visible={true} animationType="fade">
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: colors.background }}>
      <AvatarPicker
        title="Welcome to MySalapi!"
        subtitle="Let's set up your profile"
        buttonText="Complete Setup"
        onComplete={handleSetupComplete}
      />
    </View>
  </Modal>
)}
```

## Component Props

```typescript
interface AvatarPickerProps {
  onComplete?: (data: { username: string; avatarId: number }) => void;
  initialUsername?: string;
  initialAvatarId?: number;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  containerStyle?: ViewStyle;
  colors?: {
    background?: string;
    surface?: string;
    primary?: string;
    textPrimary?: string;
    textSecondary?: string;
    border?: string;
    error?: string;
  };
}
```

## Avatars Included

1. **Sunny** (ID: 1) - Pink/Red with orange accent
2. **Midnight** (ID: 2) - Orange with dark background
3. **Berry** (ID: 3) - Dark with pink accent
4. **Minty** (ID: 4) - Light green/mint

## Database Schema Addition

Add these columns to your `users` table:

```sql
-- Add avatar columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS avatar_id INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
```

## Validation Rules

- **Username**: 
  - Minimum: 3 characters
  - Maximum: 20 characters
  - Shows warning at 18+ characters
  - Real-time validation
  - Error message for < 3 characters

## Animations

1. **Initial Load**:
   - Component fades in (500ms)
   - Thumbnails stagger in (60ms delay each)

2. **Avatar Selection**:
   - Ring pulse effect (200ms scale up, 200ms scale down)
   - Avatar fade transition (100ms out, 200ms in)
   - Avatar name fades with selection

3. **Input Focus**:
   - Border color change
   - Icon color change

## Customization Examples

### Example 1: Custom Colors
```typescript
<AvatarPicker
  onComplete={handleComplete}
  colors={{
    primary: '#FF2D55',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    textPrimary: '#000000',
    textSecondary: '#666666',
    border: '#E0E0E0',
    error: '#FF3B30',
  }}
/>
```

### Example 2: Edit Mode
```typescript
<AvatarPicker
  initialUsername="john_doe"
  initialAvatarId={2}
  title="Edit Profile"
  subtitle="Update your information"
  buttonText="Save Changes"
  onComplete={handleUpdate}
/>
```

### Example 3: Custom Styling
```typescript
<AvatarPicker
  containerStyle={{
    marginHorizontal: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
  }}
  onComplete={handleComplete}
/>
```

## Display Avatar in App

Once users select an avatar, display it throughout your app:

```typescript
// Create AvatarDisplay component
const AvatarDisplay = ({ avatarId, size = 40 }: { avatarId: number; size?: number }) => {
  const avatars = {
    1: <Avatar1 />,
    2: <Avatar2 />,
    3: <Avatar3 />,
    4: <Avatar4 />,
  };

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
      <View style={{ transform: [{ scale: size / 40 }] }}>
        {avatars[avatarId] || avatars[1]}
      </View>
    </View>
  );
};

// Use in header, profile, etc.
<AvatarDisplay avatarId={user.avatar_id} size={48} />
```

## Integration Checklist

- [ ] Add `avatar_id` and `username` columns to database
- [ ] Create AvatarDisplay component for showing avatars
- [ ] Add AvatarPicker to registration flow OR profile screen
- [ ] Update user profile queries to include avatar_id
- [ ] Test avatar selection flow
- [ ] Test username validation
- [ ] Test animations on device
- [ ] Add avatar to header/navigation
- [ ] Add avatar to profile screen

## Future Enhancements

1. **More Avatars**: Add 8-12 total avatars
2. **Custom Avatars**: Allow photo upload
3. **Avatar Categories**: Group avatars by theme
4. **Preview Mode**: Show how avatar looks in different contexts
5. **Randomize**: Add "Surprise Me" button
6. **Username Availability**: Check if username is taken
7. **Social Links**: Add links to social profiles
8. **Bio Field**: Add short bio text input

## Troubleshooting

**Issue**: Avatars don't display
- **Solution**: Ensure `react-native-svg` is installed

**Issue**: Animations are laggy
- **Solution**: Test on real device, not just simulator

**Issue**: Username validation not working
- **Solution**: Check trim() is applied to username

**Issue**: Colors don't match theme
- **Solution**: Pass theme colors via `colors` prop

## Performance

- **Component size**: ~8KB
- **SVG rendering**: Optimized with viewBox
- **Animation**: Uses native driver where possible
- **Memory**: Minimal footprint

## Dependencies

All required packages already installed:
- ✅ `react-native-svg` (v15.12.1)
- ✅ `@expo/vector-icons`
- ✅ `react-native` Animated API

## Summary

The Avatar Picker is a beautiful, animated component that provides:
- 4 unique avatars to choose from
- Username input with validation
- Smooth animations
- Full theme support
- Easy integration

Perfect for user onboarding, profile setup, or profile editing!

---

**Created**: August 29, 2026  
**Version**: 1.0.0  
**License**: MIT
