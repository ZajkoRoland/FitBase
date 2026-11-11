import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import {
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';

interface AuthInputProps extends TextInputProps {
  label: string;
  secureTextEntry?: boolean;
  onContainerLayout?: (event: LayoutChangeEvent) => void;
}

export const AuthInput = forwardRef<TextInput, AuthInputProps>(function AuthInput(
  {
    label,
    secureTextEntry = false,
    onContainerLayout,
    onFocus,
    onBlur,
    ...textInputProps
  },
  ref
) {
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  const shouldHideText = secureTextEntry && isPasswordHidden;

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>

      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
        ]}
      >
        <TextInput
          ref={ref}
          style={styles.input}
          placeholderTextColor={Colors.text.secondary}
          secureTextEntry={shouldHideText}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          {...textInputProps}
        />
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeIconContainer}
            onPress={() => setIsPasswordHidden(!isPasswordHidden)}
            activeOpacity={0.7}
            focusable={false}
            accessible={false}
            importantForAccessibility="no"
            // @ts-ignore
            tabIndex={-1}
          >
            <Ionicons
              name={isPasswordHidden ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    width: '100%',
  },
  label: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    color: '#8896A5',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: Colors.background.primary,
    borderWidth: 2,
    borderColor: '#374F6B',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  inputWrapperFocused: {
    borderColor: Colors.accent.sky,
    backgroundColor: Colors.background.primary,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 16,
    color: Colors.text.primary,
    height: '100%',
  },
  eyeIconContainer: {
    padding: 4,
    marginLeft: 8,
  },
});
