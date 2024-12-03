import type { GetServerSideProps, NextPage } from 'next';
import React, { useState, useEffect, useRef } from 'react';
import { api, setContext } from '@/libs/axios';
import { useRouter } from 'next/router';
import { checkNumeric, cls, getToken, num2Cur, viewKorean } from '@/libs/utils';
import useForm from '@/components/form/useForm';
import Layout from '@/components/Layout';
import Datepicker from 'react-tailwindcss-datepicker';
import MemoEditor from '@/pages/editor/memo_editor';
import CancleModal from '@/components/modal/cancle';

import { EditForm, EditFormTable, EditFormTH, EditFormTD, EditFormLabel, EditFormCard, EditFormCardHead, EditFormCardBody } from '@/components/UIcomponent/form/EditFormA';
import EditFormCallout from '@/components/UIcomponent/form/EditFormCallout';

const AccountDetail: NextPage = (props: any) => {
    const nav_id = 12;
    const crumbs = ['상담내역', '정산내역 상세'];
    const title_sub = '';
    const callout = [
        '<span class="text-red-500">개인정보는 서비스 제공 이외의 목적으로 사용을 금합니다.</span>',
        '판매자-복지드림 고객사 상호간 서비스 체결 확인을 위해 증빙서류를<span class="text-red-500">(서비스 상품 내용 포함한 계약서 또는 거래명세서)</span>를 반드시 업로드 해주시기 바랍니다.',
        '서비스 이용기간 중 고객사로부터 서비스 관련 문의사항이 발생시, 제휴사 계약 담당자에게 해당 문의사항 내용이 이관됩니다.',
        '<span class="text-red-500">계약 내역이 제출된 후에는 수정이 불가</span>하오니, 유의바랍니다.',
    ];

    const router = useRouter();
    const [posts, setPosts] = useState<any>({});
    const [filter, setFilter] = useState<any>({});

    useEffect(() => {
        if (props) {
            console.log(props);
            s.setValues(props.response.values_memo);
            setPosts(props.response);
            setFilter(props.response.filter);
        }
    }, []);

    const { s, fn, attrs } = useForm({
        onSubmit: async () => {
            await fnEdit();
        },
    });

    const fnEdit = async () => {
        try {
            if (typeof s.values?.contract_at == 'undefined' || s.values?.contract_at.startDate == null || typeof s.values?.contract_at.startDate == 'undefined') {
                alert('계약일을 설정하세요.');
                return;
            }

            s.values.contract_price = checkNumeric(s.values?.contract_price);
            s.values.contract_date = s.values?.contract_at.startDate;
            s.values.start_date = s.values?.service_at.startDate;
            s.values.end_date = s.values?.service_at.endDate;

            const { data } = await api.post(`/scm/b2b/center/order/account/edit`, s.values);

            s.setSubmitting(false);
            if (data.code == 200) {
                alert(data.msg);
                if (data.state == '임시저장(계약진행중)') {
                    router.push(`/order/contract/detail?uid=${data.uid}`);
                } else {
                    // Go account
                    router.push(`/order/account/detail?uid=${data.uid}`);
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

    const changeLog = (uid: number, mode: string) => {
        let table_name: string = '';
        if (mode == 'account') {
            table_name = 'ACCOUNT';
        } else {
            table_name = 'T_B2B_ORDER_CONT';
        }
        window.open(`/log/popup?table_name=${table_name}&table_uid=${uid}`, '로그정보', 'width=1120,height=800,location=no,status=no,scrollbars=yes,left=400%,top=50%');
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

        var objPopup = window.open('', 'b2b_goods_view', 'width=1120,height=800, scrollbars=no, toolbar=no, status=no, resizable=no'); //창띄우기 명령에서 그 경로는 빈칸으로 한다.
        newForm.target = 'b2b_goods_view'; // 타겟 : 위의 창띄우기의 창이름과 같아야 한다.
        newForm.action = b2b_center_domain + `/inbound/goods?guid=${guid}`; // 액션경로
        if (objPopup == null) alert('차단된 팝업창을 허용해 주세요'); // 팝업이 뜨는지 확인
        else {
            newForm.submit();
            objPopup.focus(); //새로 띄워준 창에 포커스를 맞춰준다.
        }
    };

    const openConsultDetail = (ouid: number) => {
        router.push(`/order/consult/detail?uid=${ouid}`);
    };

    const openContractDetail = (ouid: number) => {
        console.log('openContractDetail');
    };

    const [cancleModalOpen, setCancleModalOpen] = useState(false);
    const [cancleInfo, setCancleInfo] = useState<any>();
    const openCancleModal = (ouid: number) => {
        setCancleModalOpen(true);
        setCancleInfo({
            ouid: posts?.ouid,
            guid: posts?.guid,
            total_commission: posts?.total_commission,
            account_date: posts?.account_date,
        });
    };

    return (
        <>
            <Layout user={props.user} title="scm b2b center console" nav_id={12} crumbs={['상담내역', '계약내역']}>
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
                                        <div className="flex justify-between items-center gap-3">
                                            <button className="btn-save px-3" type="button" onClick={() => openInboundGoods(posts?.guid)}>
                                                상품상세정보
                                            </button>
                                            <button className="btn-green-line px-3 !w-full !h-9" type="button" onClick={() => openConsultDetail(posts?.ouid)}>
                                                상담상세정보
                                            </button>
                                            <button className="btn-filter !px-3 !w-full !h-9" type="button" onClick={() => openContractDetail(posts?.ouid)}>
                                                계약상세정보
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
                            <div className="text-lg">계약 정보</div>
                        </EditFormCardHead>
                        <EditFormCardBody>
                            <div className="mb-2 text-gray-500 text-sm">
                                <span className="border-r pe-3 me-3">판매 기업 정보</span>계약담당자는 판매자정보 &#62; 기본정보 &#62; 발주담당자 정보가 기본값 입니다.
                            </div>
                            <EditFormTable className="grid-cols-6">
                                <EditFormTH className="col-span-1">판매자</EditFormTH>
                                <EditFormTD className="col-span-5">
                                    <EditFormLabel className="">{posts?.seller_id}</EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1 mand">계약담당자명</EditFormTH>
                                <EditFormTD className="col-span-5">
                                    <EditFormLabel className="">{posts?.cont_staff_name}</EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1">계약담당자 부서</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">{posts?.cont_staff_depart}</EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1">계약담당자 직책</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">{posts?.cont_staff_position}</EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1 mand">계약담당자 연락처</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">{posts?.cont_staff_phone}</EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1 mand">계약담당자 이메일</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">{posts?.cont_staff_email}</EditFormLabel>
                                </EditFormTD>
                            </EditFormTable>
                        </EditFormCardBody>
                        <EditFormCardBody>
                            <div className="mb-2 text-gray-500 text-sm">계약 정보</div>
                            <EditFormTable className="grid-cols-6">
                                <EditFormTH className="col-span-1 mand">처리상태</EditFormTH>
                                <EditFormTD className="col-span-5">
                                    <div className="flex gap-3 items-center">
                                        <div>{posts?.cont_state}</div>
                                        <div className="">
                                            <button className="btn-green-line py-1 px-3" type="button" onClick={() => changeLog(posts?.ouid, 'contract')}>
                                                변경이력
                                            </button>
                                        </div>
                                    </div>
                                </EditFormTD>
                                <EditFormTH className="col-span-1">등록일</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">{posts?.order_create_at}</EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1">최근 수정일</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">{posts?.order_update_at}</EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1">서비스기간</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">
                                        {typeof posts?.start_date != 'undefined' ? (
                                            <>
                                                {posts?.start_date} ~ {posts?.end_date}
                                            </>
                                        ) : (
                                            '해당없음'
                                        )}
                                    </EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1">복지드림 수수료</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">
                                        {posts?.commission_type == 'A' ? '계약금의 ' : '계약 건당 '}
                                        {posts?.commission}
                                        {posts?.commission_type == 'A' ? '%' : '원'}
                                    </EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1 mand">계약일</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">{posts?.contract_date}</EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1 mand">계약코드</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">{posts?.contract_code}</EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1"> </EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className=""> </EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1">계약금액</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <div className="text-end w-full">
                                        <div className="text-blue-500 text-xl font-bold kwr">{num2Cur(posts?.contract_price)}</div>
                                        <div className="text-sm text-gray-500">{viewKorean(posts?.contract_price)}</div>
                                    </div>
                                </EditFormTD>
                            </EditFormTable>
                        </EditFormCardBody>
                    </EditFormCard>

                    <EditFormCard>
                        <EditFormCardHead>
                            <div className="text-lg">정산 정보</div>
                        </EditFormCardHead>
                        <EditFormCardBody>
                            <div className="mb-2 text-gray-500 text-sm">정산 정보</div>
                            <EditFormTable className="grid-cols-6">
                                <EditFormTH className="col-span-1 mand">처리상태</EditFormTH>
                                <EditFormTD className="col-span-5">
                                    <div className="flex gap-3 items-center">
                                        <div>{posts?.account_state}</div>
                                        <div className="">
                                            <button className="btn-green-line py-1 px-3" type="button" onClick={() => changeLog(posts?.ouid, 'account')}>
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
                                <EditFormTH className="col-span-1">정산일</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">{posts?.account_date}</EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1">계약일</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">{posts?.contract_date}</EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1">정산금액</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">{num2Cur(posts?.confirm_commission)}</EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1">계약금액</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">{num2Cur(posts?.contract_price)}</EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1">취소금액</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">{num2Cur(posts?.total_cancle_price)}</EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1">계산서발행여부</EditFormTH>
                                <EditFormTD className="col-span-2">
                                    <EditFormLabel className="">{posts?.tax_invoice_date == null ? '미발행' : '발행'}</EditFormLabel>
                                </EditFormTD>
                                <EditFormTH className="col-span-1">최종정산금액</EditFormTH>
                                <EditFormTD className="col-span-5">
                                    <EditFormLabel className="won">{num2Cur(posts?.total_commission)}</EditFormLabel>
                                </EditFormTD>
                            </EditFormTable>
                        </EditFormCardBody>
                    </EditFormCard>
                    <EditFormCard>
                        <EditFormCardHead>
                            <div className="text-lg">취소/환불/가감내역</div>
                        </EditFormCardHead>
                        <div className="p-5">
                            <div className="flex gap-3 items-center">
                                <button className="px-3 py-1 bg-red-400 text-white rounded" type="button" onClick={() => openCancleModal(posts.ouid)}>
                                    취소요청
                                </button>
                                <div className="text-gray-500 text-sm">정산대기 상태일때만 취소가 가능하며, 정산진행중 또는 정산완료시 환불요청을 진행하셔야합니다.</div>
                            </div>
                        </div>
                        <EditFormCardBody>
                            <div className="mb-2 text-gray-500 text-sm">
                                <span className="border-r pe-3 me-3">가감내역 ({posts?.gagam_list?.length})</span>정산금액에 실제 반영된 금액입니다.
                            </div>
                            {posts?.gagam_list?.length > 0 && (
                                <div className="col-table mb-12">
                                    <div className="col-table-th grid grid-cols-6 sticky top-16 bg-gray-100">
                                        <div className="">가감액</div>
                                        <div className="">처리상태</div>
                                        <div className="col-span-2">처리사유</div>
                                        <div className="">등록자</div>
                                        <div className="">등록일</div>
                                    </div>
                                    {posts?.gagam_list?.map((v: any, i: number) => (
                                        <div key={i} className="col-table-td grid grid-cols-6 bg-white transition duration-300 ease-in-out hover:bg-gray-100">
                                            <div className="">{num2Cur(v.gagam_price)}</div>
                                            <div className="">{v.gagam_state}</div>
                                            <div className="col-span-2">{v.gagam_reason}</div>
                                            <div className="">{v.create_user}</div>
                                            <div className="">{v.gagam_create_at}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="mb-2 text-gray-500 text-sm">
                                <span className="border-r pe-3 me-3">취소/환불 신청내역 ({posts?.cancle_list?.length})</span>취소/환불을 신청한 로그내역 입니다.
                            </div>
                            {posts?.cancle_list?.length > 0 && (
                                <div className="col-table">
                                    <div className="col-table-th grid grid-cols-7 sticky top-16 bg-gray-100">
                                        <div className="">요청금액</div>
                                        <div className="">처리상태</div>
                                        <div className="col-span-2">처리사유</div>
                                        <div className="">환불증빙서류</div>
                                        <div className="">등록자</div>
                                        <div className="">등록일</div>
                                    </div>
                                    {posts?.cancle_list.map((v: any, i: number) => (
                                        <div key={i} className="col-table-td grid grid-cols-7 bg-white transition duration-300 ease-in-out hover:bg-gray-100">
                                            <div className="won">{num2Cur(v.cancel_price)}</div>
                                            <div className="">{v.cancel_state}</div>
                                            <div className="col-span-2">{v.cancel_reason}</div>
                                            <div className="">{v.cancel_file_name}</div>
                                            <div className="">{v.create_user}</div>
                                            <div className="">{v.cancle_create_at}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
                    </div>
                </EditForm>
                {/* <EditFormCard>
                    <EditFormCardHead>정산 메모 내역</EditFormCardHead>
                    <EditFormCardBody>
                        <div>추가하기 컴포넌트 호출</div>
                        <div>정산 메모 내역 (0)</div>
                        <div>메모 내역 컴포넌트 호출 (정산 )</div>
                        <div>계약 메모 내역 (0)</div>
                        <div>메모 내역 컴포넌트 호출 (정산 )</div>
                        <div>정산 메모 내역 (0)</div>
                        <div>상담 내역 컴포넌트 호출 (정산 )</div>
                    </EditFormCardBody>
                </EditFormCard> */}

                <MemoEditor posts={props.response} values_memo={props.response.values_memo} user={props.user} type={'정산'} />
            </Layout>
            {cancleModalOpen && <CancleModal setCancleModalOpen={setCancleModalOpen} cancleInfo={cancleInfo} values={props.response.values} />}
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
        const { data } = await api.post(`/scm/b2b/center/order/account/read`, request);
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

export default AccountDetail;
