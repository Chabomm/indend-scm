import type { GetServerSideProps, NextPage } from 'next';
import React, { useState, useEffect, useRef } from 'react';
import { api, setContext } from '@/libs/axios';
import { useRouter } from 'next/router';
import { cls, getToken } from '@/libs/utils';
import useForm from '@/components/form/useForm';
import Layout from '@/components/Layout';
import MemoEditor from '@/pages/editor/memo_editor';

import {
    EditForm,
    EditFormTable,
    EditFormTH,
    EditFormTD,
    EditFormLabel,
    EditFormCard,
    EditFormCardHead,
    EditFormCardBody,
    EditFormSelect,
    EditFormSubmit,
} from '@/components/UIcomponent/form/EditFormA';
import EditFormCallout from '@/components/UIcomponent/form/EditFormCallout';

const OrderConsultDetail: NextPage = (props: any) => {
    const nav_id = 10;
    const crumbs = ['상담내역', '상담내역 상세'];
    const title_sub = '';
    const callout = [];

    const router = useRouter();
    const [posts, setPosts] = useState<any>({});
    const [filter, setFilter] = useState<any>({});

    useEffect(() => {
        if (props) {
            if (props.response.code != 200) {
                alert(props.response.msg);
                // router.back();
            } else {
                s.setValues(props.response.values);
                setPosts(props.response);
                setFilter(props.response.filter);
            }
        }
    }, []);

    const { s, fn } = useForm({
        initialValues: {},
        onSubmit: async () => {
            await fnEdit();
        },
    });

    const fnEdit = async () => {
        try {
            const { data } = await api.post(`/scm/b2b/center/order/consult/edit`, s.values);

            s.setSubmitting(false);
            if (data.code == 200) {
                alert(data.msg);
                if (data.state == '임시저장(계약진행중)') {
                    router.push(`/order/contract/detail?uid=${data.uid}`);
                } else {
                    router.push(`/order/consult/detail?uid=${data.uid}`);
                }
            } else {
                alert(data.msg);
            }
        } catch (e: any) {}
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

    const changeLog = (uid: number) => {
        window.open(`/log/popup?table_name=T_B2B_ORDER&table_uid=${uid}`, '로그정보', 'width=1120,height=800,location=no,status=no,scrollbars=yes,left=400%,top=50%');
    };

    const openInboundGoods = async (guid: number) => {
        let b2b_center_domain = `http://localhost:13000`;
        if (`${process.env.NODE_ENV}` == 'production') {
            b2b_center_domain = `https://`;
        }

        var newForm = document.createElement('form');
        newForm.setAttribute('method', 'POST');

        var newInput = document.createElement('input');
        newInput.setAttribute('type', 'hidden');
        newInput.setAttribute('name', 'token');
        newInput.setAttribute('value', getToken(undefined));
        newForm.appendChild(newInput);

        var newInput = document.createElement('input');
        newInput.setAttribute('type', 'hidden');
        newInput.setAttribute('name', 'guid');
        newInput.setAttribute('value', guid + '');
        newForm.appendChild(newInput);

        document.body.appendChild(newForm);

        var objPopup = window.open('', 'b2b_goods_view', 'width=1120,height=800, scrollbars=no, toolbar=no, status=no, resizable=no');
        newForm.target = 'b2b_goods_view';
        newForm.action = b2b_center_domain + `/inbound/goods?guid=${guid}`;
        if (objPopup == null) alert('차단된 팝업창을 허용해 주세요');
        else {
            newForm.submit();
            objPopup.focus();
        }
    };

    const openContractDetail = (ouid: number) => {
        router.push(`/order/contract/detail?uid=${ouid}`);
    };

    return (
        <>
            <Layout nav_id={nav_id} crumbs={crumbs} title={crumbs[crumbs.length - 1]} user={props.user}>
                <EditFormCallout title={crumbs[crumbs.length - 1]} title_sub={title_sub} callout={callout} />
                <EditForm onSubmit={fn.handleSubmit}>
                    <EditFormCard>
                        <EditFormCardHead>
                            <div className="text-lg">서비스 상품 신청 정보</div>
                        </EditFormCardHead>
                        <EditFormCardBody>
                            <div className="mb-2 text-gray-500 text-sm">상품 기본 정보</div>
                            <EditFormTable className="grid-cols-6">
                                <EditFormTH className="col-span-1">서비스명</EditFormTH>
                                <EditFormTD className="col-span-5 ">
                                    <EditFormLabel className="flex justify-between items-center">
                                        <div>{posts?.title}</div>
                                        <div>
                                            <button className="btn-save px-3" type="button" onClick={() => openInboundGoods(posts?.guid)}>
                                                상품상세정보
                                            </button>
                                        </div>
                                    </EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1">카테고리</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">{posts?.category}</EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1">옵션</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className=""> </EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1">복지드림 수수료</EditFormTH>
                                <EditFormTD className="col-span-5">
                                    <EditFormLabel className="">
                                        {posts?.commission_type == 'A' ? '계약금의 ' : '계약 건당 '}
                                        {posts?.commission}
                                        {posts?.commission_type == 'A' ? '%' : '원'}
                                    </EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1">연락처</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">{posts?.apply_phone}</EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1">이메일</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">{posts?.apply_email}</EditFormLabel>
                                </EditFormTD>
                            </EditFormTable>
                        </EditFormCardBody>
                        {posts?.info_list?.length > 0 && (
                            <EditFormCardBody>
                                <div className="mb-2 text-gray-500 text-sm">추가 신청 정보</div>
                                <div className="border-t border-black">
                                    {posts?.info_list?.map((v: any, i: number) => (
                                        <EditFormTable key={i} className="grid-cols-6 !border-t-0">
                                            <EditFormTH className={cls(`${v.option_yn == 'Y' && 'mand'} col-span-1`)}>{v.option_title}</EditFormTH>
                                            <EditFormTD className="col-span-5">
                                                {v.option_type == 'F' ? (
                                                    <button
                                                        type="button"
                                                        className="text-blue-500 underline cursor-pointer"
                                                        onClick={e => {
                                                            download_file(v, 'info_list');
                                                        }}
                                                    >
                                                        파일 첨부 확인 ({v.file_name})
                                                    </button>
                                                ) : v.option_type == 'G' ? (
                                                    <div className="w-full text-start">{v.placeholder}</div>
                                                ) : (
                                                    <div className="w-full text-start whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: v.apply_value }}></div>
                                                )}
                                            </EditFormTD>
                                        </EditFormTable>
                                    ))}
                                </div>
                            </EditFormCardBody>
                        )}
                    </EditFormCard>

                    <EditFormCard>
                        <EditFormCardHead>
                            <div className="text-lg">구매자 정보</div>
                        </EditFormCardHead>
                        <EditFormCardBody>
                            <div className="mb-2 text-gray-500 text-sm">신청 기업 정보</div>
                            <EditFormTable className="grid-cols-6">
                                <EditFormTH className="col-span-1">회사명</EditFormTH>
                                <EditFormTD className="col-span-5">
                                    <EditFormLabel className="">{posts?.apply_company}</EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1 mand">담당자명</EditFormTH>
                                <EditFormTD className="col-span-5">
                                    <EditFormLabel className="">{posts?.apply_name}</EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1">부서</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">{posts?.apply_depart}</EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1">직책</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">{posts?.apply_position}</EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1 mand">연락처</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">{posts?.apply_phone}</EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1 mand">이메일</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">{posts?.apply_email}</EditFormLabel>
                                </EditFormTD>
                            </EditFormTable>
                        </EditFormCardBody>
                    </EditFormCard>

                    <EditFormCard>
                        <EditFormCardHead>
                            <div className="text-lg">상담 정보</div>
                        </EditFormCardHead>
                        <EditFormCardBody>
                            <div className="mb-2 text-gray-500 text-sm">상담 처리 상태변경</div>
                            <EditFormTable className="grid-cols-6">
                                <EditFormTH className="col-span-1 mand">처리상태</EditFormTH>
                                <EditFormTD className="col-span-5">
                                    <div className="w-full flex gap-3 items-center">
                                        <EditFormSelect
                                            input_name="state"
                                            value={s.values?.state || ''}
                                            filter_list={filter?.state}
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['state'] ? 'border-danger' : '', 'form-select flex-shrink !w-36')}
                                            disabled={posts?.state == '계약진행' ? true : false}
                                        />
                                        <div className="">
                                            <button className="btn-green-line py-1 px-3" type="button" onClick={() => changeLog(posts?.uid)}>
                                                변경이력
                                            </button>
                                        </div>
                                    </div>
                                </EditFormTD>
                                <EditFormTH className="col-span-1">등록일</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">{posts?.create_at}</EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1">최근 수정일</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">{posts?.update_at}</EditFormLabel>
                                </EditFormTD>
                            </EditFormTable>
                        </EditFormCardBody>
                    </EditFormCard>

                    <div className="mt-5 w-full text-center mb-5">
                        <button
                            className="mr-3 px-5 border btn-filter rounded-md py-2 text-center"
                            disabled={s.submitting}
                            type="button"
                            onClick={() => router.push(`/order/consult/list`)}
                        >
                            목록으로
                        </button>
                        {posts?.state != '계약진행' && (
                            <button className="mr-3 px-5 bg-blue-500 rounded-md py-2 text-white text-center" disabled={s.submitting}>
                                저장
                            </button>
                        )}
                    </div>
                </EditForm>

                <MemoEditor posts={props.response} values_memo={props.response.values_memo} user={props.user} type={'상담'} />
            </Layout>
        </>
    );
};
export const getServerSideProps: GetServerSideProps = async ctx => {
    setContext(ctx);
    var request: any = {
        uid: ctx.query.uid,
    };
    var response: any = {};
    try {
        const { data } = await api.post(`/scm/b2b/center/order/consult/read`, request);
        response = data;
    } catch (e: any) {
        if (typeof e.redirect !== 'undefined') {
            return { redirect: e.redirect };
        }
    }
    return {
        props: { request, response },
    };
};

export default OrderConsultDetail;
