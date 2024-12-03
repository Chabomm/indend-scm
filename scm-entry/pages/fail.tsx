import type { NextPage } from 'next';
import { useRouter } from 'next/router';

const MainFail: NextPage = () => {
    const router = useRouter();
    let { msg } = router.query;

    if (typeof msg !== 'undefined' && msg != '') {
        alert(msg + '');
    }

    return (
        <div className="flex h-screen justify-center items-center bg-neutral-200">
            <h5>
                <strong>유효하지 않은 요청입니다.</strong>
            </h5>
        </div>
    );
};

export default MainFail;
