import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';

import 'tui-color-picker/dist/tui-color-picker.css';
import '@toast-ui/editor-plugin-color-syntax/dist/toastui-editor-plugin-color-syntax.css';
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';

const ToastEditor = (props: any) => {
    return (
        <Editor
            hooks={props.hooks}
            ref={props.forwardedRef}
            height="calc(100vh - 4rem)"
            plugins={[colorSyntax]}
            placeholder="글을 작성해주세요!"
            initialEditType="wysiwyg"
            // initialEditType="markdown"
            previewStyle="vertical" // or tab
            toolbarItems={[['heading', 'bold', 'italic', 'strike'], ['hr'], ['ul', 'ol', 'task'], ['table', 'link'], ['image'], ['code'], ['scrollSync']]}
        />
    );
};

export default ToastEditor;
