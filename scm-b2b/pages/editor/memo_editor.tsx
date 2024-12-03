import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/libs/axios';
import { useRouter } from 'next/router';
import { cls, dateformatYYYYMM } from '@/libs/utils';
import useForm from '@/components/form/useForm';

import {
    EditForm,
    EditFormTable,
    EditFormTH,
    EditFormTD,
    EditFormSubmit,
    EditFormInput,
    EditFormLabel,
    EditFormAttachFiles,
    EditFormTextarea,
} from '@/components/UIcomponent/form/EditFormA';
import EditFormCallout from '@/components/UIcomponent/form/EditFormCallout';

interface Props {
    posts: any;
    values_memo: any;
    user: any;
    type: string;
}
export default function MemoEditor({ posts, values_memo, user, type }: Props) {
    const router = useRouter();

    useEffect(() => {
        s.setValues(values_memo);
    }, []);

    const { s, fn } = useForm({
        initialValues: {},
        onSubmit: async () => {
            await memoCreate();
        },
    });

    const memoCreate = async () => {
        try {
            if (typeof s.values.memo == 'undefined' || s.values.memo == '') {
                alert('메모를 입력하세요.');
                const el = document.querySelector("input[name='memo']");
                (el as HTMLElement)?.focus();
                return;
            }
            let table_name: string = 'T_B2B_ORDER';
            let table_uid: number = posts.uid;
            if (type == '계약') {
                table_name = 'T_B2B_ORDER_CONT';
                table_uid = posts.ouid;
            } else if (type == '정산') {
                table_name = 'T_B2B_ORDER_ACCOUNT';
                table_uid = posts.ouid;
            }

            const params = {
                table_uid: table_uid,
                table_name: table_name,
                memo: s.values.memo,
                file_url: s.values.memo_file_url,
                file_name: s.values.memo_file_name,
            };

            const { data } = await api.post(`/scm/b2b/center/auth/memo/create`, params);

            s.setSubmitting(false);
            if (data.code == 200) {
                alert(data.msg);
                router.reload();
            } else {
                alert(data.msg);
            }
        } catch (e: any) {}
    };

    const fileDel = () => {
        let copy = { ...s.values };
        copy.memo_file_url = '';
        copy.memo_file_name = '';
        s.setValues(copy);
    };

    const handleChangeOrderInfoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, options: any) => {
        if (typeof options.start !== 'undefined') {
            options.start();
        }
        try {
            let files: any = e.target.files;
            let copy = { ...s.values };
            for (var i = 0; i < files.length; i++) {
                var file = files[i];

                const formData = new FormData();
                formData.append('file_object', file);
                formData.append('upload_path', options.upload_path);
                const { data } = await api.post(`/scm/aws/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

                copy.memo_file_url = data.s3_url;
                copy.memo_file_name = data.fake_name;
            }

            s.setValues(copy);
            e.target.value = '';
        } catch (e) {
            if (typeof options.start !== 'undefined') {
                options.end();
            }
        }

        if (typeof options.start !== 'undefined') {
            options.end();
        }
    };

    const openContractDetail = (ouid: number) => {
        router.push(`/order/contract/detail?uid=${ouid}`);
    };

    const FileUpload = useRef<any>();
    const fileUploadBtn = () => {
        FileUpload.current.click();
    };
    const [loading, setLoading] = useState<boolean>(false);
    const fnStartUploading = () => {
        setLoading(true);
    };

    const fnEndUploading = () => {
        setLoading(false);
    };

    // [ S ] 파일 다운로드
    const download_file = async (file: any, kind: string) => {
        let file_link = '';
        if (kind == 'memo_list') {
            file_link = file.file_url;
        } else {
            file_link = file.apply_value;
        }

        try {
            await api({
                url: `/scm/aws/download`,
                method: 'POST',
                responseType: 'blob',
                data: { file_url: file_link },
            }).then(async response => {
                var fileURL = window.URL.createObjectURL(new Blob([response.data]));
                var fileLink = document.createElement('a');
                fileLink.href = fileURL;
                fileLink.setAttribute('download', file.file_name);
                document.body.appendChild(fileLink);
                fileLink.click();

                await api.post(`/scm/aws/temp/delete`);
            });
        } catch (e: any) {
            console.log(e);
        }
    };
    // [ E ] 파일 다운로드

    const opeAccontDetail = (uid: number) => {
        console.log('opeAccontDetail', uid);
    };

    return (
        <form onSubmit={fn.handleSubmit} noValidate>
            {loading && (
                <div className="fixed w-full h-screen bg-opacity-25 bg-white z-10 flex items-center justify-center">
                    <div className="text-lg bg-white px-5 py-3 border rounded">
                        <i className="fas fa-spinner me-2"></i>파일 업로드 중 ...
                    </div>
                </div>
            )}
            <div className="border rounded-md bg-white mb-5">
                <div className="border-b p-4 flex gap-4 justify-between">
                    <div className="text-lg">{type} 메모 내역</div>
                </div>
                <div className="p-5">
                    {type == '상담' ? '' : ''}
                    {posts?.state == '계약진행' && type == '상담' ? (
                        <div className="flex justify-between">
                            <div>계약진행 중인 상담은 더이상 상담 메모를 추가할 수 없습니다. 계약상세에서 진행해 주세요</div>
                            <button className="px-5 bg-blue-500 rounded-md py-2 text-white text-center" type="button" onClick={() => openContractDetail(posts?.uid)}>
                                계약상세보기
                            </button>
                        </div>
                    ) : posts?.cont_state == '계약완료(정산대기)' && type == '계약' ? (
                        <div className="flex justify-between">
                            <div>정산진행 중인 계약은 더이상 계약 메모를 추가할 수 없습니다. 정산상세에서 진행해 주세요</div>
                            <button className="px-5 bg-blue-500 rounded-md py-2 text-white text-center" type="button" onClick={() => opeAccontDetail(posts?.ouid)}>
                                정산상세보기
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-2 text-gray-500 text-sm">{type} 메모 추가하기</div>
                            <table className="form-table table table-bordered align-middle w-full border-t-2 border-black">
                                <tbody className="border-t border-black">
                                    <tr className="border-b">
                                        <th scope="row" className="table_must">
                                            {type}자 메모
                                        </th>
                                        <td className="" colSpan={3}>
                                            <EditFormTextarea
                                                name="memo"
                                                value={s.values?.memo || ''}
                                                rows={4}
                                                placeholder="상담 문의 및 요청내용을 입력하세요"
                                                is_mand={true}
                                                errors={s.errors}
                                                values={s.values}
                                                set_values={s.setValues}
                                                max_length={500}
                                            />
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <th scope="row">파일첨부</th>
                                        <td colSpan={3} className="">
                                            <div className="flex gap-3 items-center w-full text-start whitespace-pre-wrap">
                                                <button type="button" className="btn-filter me-3" onClick={() => fileUploadBtn()}>
                                                    <i className="far fa-file"></i> 파일업로드
                                                    <input
                                                        type="file"
                                                        name="apply_value"
                                                        multiple
                                                        ref={FileUpload}
                                                        onChange={e => {
                                                            handleChangeOrderInfoFileUpload(e, {
                                                                upload_path: '/b2b/order/consult/',
                                                                start: fnStartUploading,
                                                                end: fnEndUploading,
                                                            });
                                                        }}
                                                        className="hidden"
                                                    />
                                                </button>
                                                {s.values?.memo_file_name != '' && typeof s.values?.memo_file_name != 'undefined' && (
                                                    <div>
                                                        <span className="text-blue-500">{s.values?.memo_file_name}</span>
                                                        <span className="ms-2 cursor-pointer" onClick={fileDel}>
                                                            <i className="far fa-times-circle"></i>
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <th scope="row">등록자</th>
                                        <td colSpan={3} className="">
                                            <div className="w-full text-start whitespace-pre-wrap">
                                                {user.staff_name}({user.staff_id})
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="mt-5 w-full text-center">
                                <button className="mr-3 px-5 bg-blue-500 rounded-md py-2 text-white" disabled={s.submitting}>
                                    등록하기
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className="py-3 px-5">
                    <div className="mb-2 text-gray-500 text-sm">
                        {type} 메모 내역 ({posts?.memo_list?.length})
                    </div>
                    <table className="form-table table table-bordered align-middle w-full border-t-2 border-black">
                        <tbody className="border-t border-black">
                            {posts?.memo_list?.map((v: any, i: number) => (
                                <tr key={i} className="border-b">
                                    <th scope="row" className="text-center">
                                        {v.create_user}
                                        <br />({v.sosok_id})
                                    </th>
                                    <td colSpan={3} className="">
                                        <div className="w-full text-start whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: v.memo }}></div>

                                        {v.file_url != '' && v.file_url != null && (
                                            <div className="text-blue-500 cursor-pointer" onClick={() => download_file(v, 'memo_list')}>
                                                {v.file_name}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {'contrant_memo_list' in posts && (
                    <div className="py-3 px-5">
                        <div className="mb-2 text-gray-500 text-sm">계약 메모 내역 ({posts?.contrant_memo_list?.length})</div>
                        <table className="form-table table table-bordered align-middle w-full border-t-2 border-black">
                            <tbody className="border-t border-black">
                                {posts?.contrant_memo_list?.map((v: any, i: number) => (
                                    <tr key={i} className="border-b">
                                        <th scope="row" className="text-center">
                                            {v.create_user}
                                            <br />({v.sosok_id})
                                        </th>
                                        <td colSpan={3} className="">
                                            <div className="w-full text-start whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: v.memo }}></div>

                                            {v.file_url != '' && v.file_url != null && (
                                                <div className="text-blue-500 cursor-pointer" onClick={() => download_file(v, 'memo_list')}>
                                                    {v.file_name}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {'consult_memo_list' in posts && (
                    <div className="py-3 px-5">
                        <div className="mb-2 text-gray-500 text-sm">상담 메모 내역 ({posts?.consult_memo_list?.length})</div>
                        <table className="form-table table table-bordered align-middle w-full border-t-2 border-black">
                            <tbody className="border-t border-black">
                                {posts?.consult_memo_list?.map((v: any, i: number) => (
                                    <tr key={i} className="border-b">
                                        <th scope="row" className="text-center">
                                            {v.create_user}
                                            <br />({v.sosok_id})
                                        </th>
                                        <td colSpan={3} className="">
                                            <div className="w-full text-start whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: v.memo }}></div>

                                            {v.file_url != '' && v.file_url != null && (
                                                <div className="text-blue-500 cursor-pointer" onClick={() => download_file(v, 'memo_list')}>
                                                    {v.file_name}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </form>
    );
}
