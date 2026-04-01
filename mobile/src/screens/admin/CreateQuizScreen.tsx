import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    Alert, 
    KeyboardAvoidingView, 
    Platform,
    Image as RNImage
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { theme } from '../../theme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const STORAGE_BUCKET = 'question-images-v2';

interface Option {
    id: string;
    text: string;
    is_correct: boolean;
}

interface Question {
    id: string;
    text: string;
    image_uri?: string;
    image_mime?: string;
    video_url: string;
    options: Option[];
}

export default function CreateQuizScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [timeLimit, setTimeLimit] = useState('');
    
    const [questions, setQuestions] = useState<Question[]>([
        {
            id: Math.random().toString(36).substring(2, 11),
            text: '',
            video_url: '',
            options: [
                { id: Math.random().toString(36).substring(2, 11), text: '', is_correct: false },
                { id: Math.random().toString(36).substring(2, 11), text: '', is_correct: false },
            ]
        }
    ]);

    const addQuestion = () => {
        setQuestions([...questions, {
            id: Math.random().toString(36).substring(2, 11),
            text: '',
            video_url: '',
            options: [
                { id: Math.random().toString(36).substring(2, 11), text: '', is_correct: false },
                { id: Math.random().toString(36).substring(2, 11), text: '', is_correct: false },
            ]
        }]);
    };

    const removeQuestion = (index: number) => {
        if (questions.length === 1) return;
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (id: string, updates: Partial<Question>) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
    };

    const addOption = (questionId: string) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    options: [...q.options, { id: Math.random().toString(36).substring(2, 11), text: '', is_correct: false }]
                };
            }
            return q;
        }));
    };

    const removeOption = (questionId: string, optionId: string) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId && q.options.length > 2) {
                return {
                    ...q,
                    options: q.options.filter(o => o.id !== optionId)
                };
            }
            return q;
        }));
    };

    const updateOption = (questionId: string, optionId: string, updates: Partial<Option>) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    options: q.options.map(o => {
                        if (o.id === optionId) {
                            if (updates.is_correct) {
                                return { ...o, is_correct: true };
                            }
                            return { ...o, ...updates };
                        }
                        // If marking one as correct, unmark all others for this question
                        if (updates.is_correct) {
                            return { ...o, is_correct: false };
                        }
                        return o;
                    })
                };
            }
            return q;
        }));
    };

    const pickImage = async (questionId: string) => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.7,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                const mimeType = asset.mimeType || 'image/jpeg';
                updateQuestion(questionId, {
                    image_uri: asset.uri,
                    image_mime: mimeType,
                });
            }
        } catch (error) {
            console.warn('Image picker error:', error);
            Alert.alert('Image Error', 'We could not open that image. Please try another photo.');
        }
    };

    const decodeBase64 = (base64: string) => {
        if (typeof globalThis.atob !== 'function') {
            throw new Error('Base64 decoding is not available on this device.');
        }

        const byteCharacters = globalThis.atob(base64);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteArray[i] = byteCharacters.charCodeAt(i);
        }
        return byteArray;
    };

    const uploadImage = async (q: { image_uri?: string; image_mime?: string }): Promise<string | null> => {
        try {
            if (!q.image_uri) return null;

            const mimeType = q.image_mime || 'image/jpeg';
            const fileExt = mimeType.split('/')[1] || 'jpg';
            const fileName = `${Math.random().toString(36).substring(2, 11)}_${Date.now()}.${fileExt}`;
            const filePath = `${user?.id}/${fileName}`;

            const imageBase64 = await FileSystem.readAsStringAsync(q.image_uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            const byteArray = decodeBase64(imageBase64);

            const { error: uploadError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(filePath, byteArray, { contentType: mimeType });

            if (uploadError) throw uploadError;
            return filePath;
        } catch (error) {
            console.warn('Upload error:', error);
            return null;
        }
    };

    const validate = () => {
        if (!title.trim()) {
            Alert.alert('Validation Error', 'Please enter a quiz title.');
            return false;
        }
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.text.trim()) {
                Alert.alert('Validation Error', `Question ${i + 1} is empty.`);
                return false;
            }
            const correctOption = q.options.find(o => o.is_correct);
            if (!correctOption) {
                Alert.alert('Validation Error', `Question ${i + 1} must have one correct answer selected.`);
                return false;
            }
            if (q.options.some(o => !o.text.trim())) {
                Alert.alert('Validation Error', `One or more options in Question ${i + 1} are empty.`);
                return false;
            }
        }
        return true;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setLoading(true);

        try {
            // 1. Create Quiz
            const { data: quizData, error: quizError } = await supabase
                .from('quizzes')
                .insert({
                    title: title.trim(),
                    description: description.trim(),
                    created_by: user?.id,
                    time_limit: timeLimit ? parseInt(timeLimit) : null,
                    is_published: true
                })
                .select()
                .single();

            if (quizError) throw quizError;

            // 2. Process Questions
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                let finalImagePath = '';
                
                if (q.image_uri) {
                    finalImagePath = await uploadImage(q) || '';
                }

                const { data: questionData, error: qError } = await supabase
                    .from('questions')
                    .insert({
                        quiz_id: quizData.id,
                        text: q.text.trim(),
                        image_url: finalImagePath,
                        video_url: q.video_url.trim(),
                        order: i
                    })
                    .select()
                    .single();

                if (qError) throw qError;

                // 3. Create Options
                const optionsToInsert = q.options.map(o => ({
                    question_id: questionData.id,
                    text: o.text.trim(),
                    is_correct: o.is_correct
                }));

                const { error: optError } = await supabase
                    .from('options')
                    .insert(optionsToInsert);

                if (optError) throw optError;
            }

            Alert.alert('Success! 🎉', 'Your quiz is live and ready to play!', [
                {
                    text: 'Go to Home',
                    onPress: () => {
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'HomeTab' }],
                            })
                        );
                    }
                }
            ]);

        } catch (error: any) {
            console.warn('Save error:', error);
            Alert.alert('Error', error.message || 'Failed to create quiz.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex1}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>New Quiz</Text>
                        <Text style={styles.headerSubtitle}>Design your quiz on the go</Text>
                    </View>

                    <View style={styles.card}>
                        <Input 
                            label="Quiz Title" 
                            placeholder="e.g. Science Challenge" 
                            value={title}
                            onChangeText={setTitle}
                        />
                        <Input 
                            label="Description" 
                            placeholder="What is this quiz about?" 
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={3}
                            style={styles.textArea}
                        />
                        <Input 
                            label="Time Limit (minutes - optional)" 
                            placeholder="e.g. 10" 
                            value={timeLimit}
                            onChangeText={setTimeLimit}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Questions</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{questions.length}</Text>
                        </View>
                    </View>

                    {questions.map((q, qIndex) => (
                        <View key={q.id} style={styles.questionCard}>
                            <View style={styles.questionCardHeader}>
                                <Text style={styles.questionNumber}>Question {qIndex + 1}</Text>
                                <TouchableOpacity 
                                    onPress={() => removeQuestion(qIndex)} 
                                    disabled={questions.length === 1}
                                    style={styles.deleteQuestion}
                                >
                                    <Ionicons 
                                        name="trash-outline" 
                                        size={18} 
                                        color={questions.length === 1 ? theme.colors.text.muted : theme.colors.error.DEFAULT} 
                                    />
                                </TouchableOpacity>
                            </View>

                            <Input 
                                placeholder="Write your question here..." 
                                value={q.text}
                                onChangeText={(text) => updateQuestion(q.id, { text })}
                                multiline
                                style={styles.questionInput}
                            />

                            <View style={styles.mediaActions}>
                                <TouchableOpacity style={styles.imageAction} onPress={() => pickImage(q.id)}>
                                    <Ionicons name="image-outline" size={18} color={theme.colors.secondary[400]} />
                                    <Text style={styles.actionText}>{q.image_uri ? 'Change' : 'Add Image'}</Text>
                                </TouchableOpacity>
                                <View style={styles.videoAction}>
                                    <Input 
                                        placeholder="YouTube Video URL" 
                                        value={q.video_url}
                                        onChangeText={(url) => updateQuestion(q.id, { video_url: url })}
                                        style={styles.compactInput}
                                        containerStyle={{ marginBottom: 0 }}
                                    />
                                </View>
                            </View>

                            {q.image_uri && (
                                <View style={styles.previewContainer}>
                                    <RNImage source={{ uri: q.image_uri }} style={styles.previewImage} />
                                    <TouchableOpacity 
                                        style={styles.removeImage} 
                                        onPress={() => updateQuestion(q.id, { image_uri: undefined, image_mime: undefined })}
                                    >
                                        <Ionicons name="close-circle" size={24} color={theme.colors.error.DEFAULT} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            <Text style={styles.optionsTitle}>Answer Options</Text>
                            {q.options.map((option, oIndex) => (
                                <View key={option.id} style={styles.optionItem}>
                                    <TouchableOpacity 
                                        style={[
                                            styles.radio, 
                                            option.is_correct && styles.radioActive
                                        ]} 
                                        onPress={() => updateOption(q.id, option.id, { is_correct: true })}
                                    >
                                        {option.is_correct && <View style={styles.radioInner} />}
                                    </TouchableOpacity>
                                    <Input 
                                        placeholder={`Option ${oIndex + 1}`} 
                                        value={option.text}
                                        onChangeText={(text) => updateOption(q.id, option.id, { text })}
                                        style={[styles.smallInput, option.is_correct && styles.correctInput]}
                                        containerStyle={{ flex: 1, marginBottom: 0 }}
                                    />
                                    <TouchableOpacity 
                                        onPress={() => removeOption(q.id, option.id)}
                                        disabled={q.options.length <= 2}
                                        style={styles.removeOption}
                                    >
                                        <Ionicons 
                                            name="close-outline" 
                                            size={20} 
                                            color={q.options.length <= 2 ? theme.colors.text.muted : theme.colors.text.secondary} 
                                        />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            <TouchableOpacity style={styles.addOption} onPress={() => addOption(q.id)}>
                                <Ionicons name="add" size={16} color={theme.colors.secondary[400]} />
                                <Text style={styles.addOptionText}>Add Option</Text>
                            </TouchableOpacity>
                        </View>
                    ))}

                    <Button 
                        title="Add New Question" 
                        onPress={addQuestion}
                        variant="ghost"
                        style={styles.addQuestionBtn}
                        icon={<Ionicons name="add-circle" size={20} color={theme.colors.primary[300]} />}
                    />

                    <View style={styles.submitContainer}>
                        <Button 
                            title={loading ? "Saving Quiz..." : "Create Quiz"} 
                            onPress={handleSave}
                            loading={loading}
                            size="lg"
                            style={styles.submitBtn}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    flex1: {
        flex: 1,
    },
    scrollContent: {
        padding: theme.spacing.lg,
        paddingBottom: 60,
    },
    header: {
        marginBottom: theme.spacing.xl,
    },
    headerTitle: {
        fontSize: theme.typography.sizes.xxxl,
        fontWeight: theme.typography.weights.extrabold,
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: theme.typography.sizes.md,
        color: theme.colors.text.secondary,
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xxl,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: theme.spacing.xl,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.primary,
    },
    badge: {
        backgroundColor: theme.colors.primary[500],
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    questionCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xxl,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: theme.spacing.lg,
    },
    questionCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    questionNumber: {
        fontSize: 11,
        fontWeight: '800',
        color: theme.colors.primary[300],
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    deleteQuestion: {
        padding: 4,
    },
    questionInput: {
        fontSize: 18,
        fontWeight: theme.typography.weights.bold,
        borderWidth: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
    },
    mediaActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 4,
        marginBottom: theme.spacing.md,
    },
    imageAction: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceLight,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    actionText: {
        color: theme.colors.text.secondary,
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    videoAction: {
        flex: 1,
    },
    compactInput: {
        fontSize: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    previewContainer: {
        width: '100%',
        height: 160,
        backgroundColor: '#000',
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        marginBottom: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    removeImage: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    optionsTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: theme.colors.text.muted,
        marginBottom: theme.spacing.md,
        textTransform: 'uppercase',
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioActive: {
        borderColor: theme.colors.success.DEFAULT,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.colors.success.DEFAULT,
    },
    smallInput: {
        fontSize: 14,
        paddingVertical: 10,
        borderRadius: 12,
    },
    correctInput: {
        borderColor: theme.colors.success.bg,
    },
    removeOption: {
        padding: 4,
    },
    addOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        paddingLeft: 4,
    },
    addOptionText: {
        fontSize: 13,
        color: theme.colors.secondary[400],
        fontWeight: 'bold',
    },
    addQuestionBtn: {
        marginTop: theme.spacing.md,
        borderStyle: 'dashed',
    },
    submitContainer: {
        marginTop: theme.spacing.xxxl,
    },
    submitBtn: {
        backgroundColor: theme.colors.secondary[500],
    }
});
